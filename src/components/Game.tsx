import React, { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../utils/audio';
import { useGameStore } from '../store/useGameStore';
import { ASSET_PATHS, GAME_SETTINGS } from '../constants';
import { preloadAssets } from '../utils/assetLoader';
import { getLaneFromClientX } from '../utils/input';
import { GameEngine } from '../utils/gameEngine';
import { logger } from '../utils/logger';
import { PerfSampler, type PerfSnapshot } from '../utils/perfSampler';
import { safeStorage } from '../utils/safeStorage';
import { isEnabledFlag } from '../utils/flags';
import GameHud from './GameHud';
import GameOverlay from './GameOverlay';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const lastSwipeLaneRef = useRef<number | null>(null);
  const {
    score,
    highScore,
    gameOver,
    isPlaying,
    isFeverMode,
    feverProgress,
    comboMultiplier,
    shieldCharges,
    soundEnabled,
    leaderboard,
    startGame: startStoreGame,
    addScore,
    setFeverMode,
    setGameOver,
    recordHit,
    recordMiss,
    consumeShield,
    activateShield,
    activateSlowMo,
    addLeaderboardScore,
    isSlowMoActive,
    toggleSound,
  } = useGameStore();

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [perfSnapshot, setPerfSnapshot] = useState<PerfSnapshot | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const perfSamplerRef = useRef(new PerfSampler());
  const perfUpdateCounterRef = useRef(0);
  const isMountedRef = useRef(true);

  const showPerfHud = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const query = new URLSearchParams(window.location.search).get('debugPerf');
    const localValue = safeStorage.getItem('pinik_debug_perf');
    return isEnabledFlag(query) || isEnabledFlag(localValue);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stopLoop = () => {
    engineRef.current?.stop();
    engineRef.current = null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { images } = await preloadAssets(
          Object.values(ASSET_PATHS.IMAGES),
          Object.values(ASSET_PATHS.ANIMATIONS)
        );
        imagesRef.current = images;
        setAssetsLoaded(true);
      } catch (error) {
        console.error('[Game] Asset load failed:', error);
        logger.error('Failed to load assets', { error });
      }
    };
    load();
  }, []);

  useEffect(() => {
    audio.setMuted(!soundEnabled);
    if (!soundEnabled) {
      audio.stopBgm();
    }
  }, [soundEnabled]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const triggerHaptic = (pattern: number | number[] = 16) => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(pattern);
  };

  const startGame = () => {
    audio.init();
    if (soundEnabled) {
      audio.playBgm();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    stopLoop();
    startStoreGame();
    perfSamplerRef.current.reset();
    perfUpdateCounterRef.current = 0;
    setPerfSnapshot(null);

    engineRef.current = new GameEngine(
      canvas,
      imagesRef.current,
      {
        laneCount: GAME_SETTINGS.LANE_COUNT,
        tileHeight: GAME_SETTINGS.TILE_HEIGHT,
        initialSpeed: GAME_SETTINGS.INITIAL_SPEED,
        speedIncrement: GAME_SETTINGS.SPEED_INCREMENT,
        maxSpeed: GAME_SETTINGS.MAX_SPEED,
        feverThreshold: GAME_SETTINGS.FEVER_THRESHOLD,
      },
      {
        getScore: () => useGameStore.getState().score,
        getIsFeverMode: () => useGameStore.getState().isFeverMode,
        getIsPlaying: () => useGameStore.getState().isPlaying,
        getGameOver: () => useGameStore.getState().gameOver,
        getIsSlowMo: () => useGameStore.getState().isSlowMoActive(),
        getSoundEnabled: () => useGameStore.getState().soundEnabled,
        setFeverMode,
        addScore,
        setGameOver,
        addLeaderboardScore,
        recordHit,
        recordMiss,
        consumeShield,
        activateShield,
        activateSlowMo,
        playFeverActivation: () => audio.playFeverActivation(),
        playTapSound: (lane: number, isFever: boolean) => audio.playTapSound(lane, isFever),
        playErrorSound: () => audio.playErrorSound(),
        triggerHaptic,
        getReducedMotion: () => reducedMotion,
        stopBgm: () => audio.stopBgm(),
        onFrame: (timestamp) => {
          if (!showPerfHud || !isMountedRef.current) return;
          const snapshot = perfSamplerRef.current.sample(timestamp);
          perfUpdateCounterRef.current += 1;
          if (perfUpdateCounterRef.current >= 10) {
            setPerfSnapshot(snapshot);
            perfUpdateCounterRef.current = 0;
          }
        },
      }
    );
    engineRef.current.start();
  };

  const handleInteraction = (clientX: number) => {
    const { isPlaying: playing, gameOver: over } = useGameStore.getState();
    if (!playing || over) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickedLane = getLaneFromClientX(clientX, rect.left, canvas.clientWidth, GAME_SETTINGS.LANE_COUNT);
    if (clickedLane === -1) return;

    engineRef.current?.handleTap(clickedLane);
  };

  const handleTouchMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const lane = getLaneFromClientX(clientX, rect.left, canvas.clientWidth, GAME_SETTINGS.LANE_COUNT);
    if (lane === -1 || lane === lastSwipeLaneRef.current) return;
    lastSwipeLaneRef.current = lane;
    engineRef.current?.handleTap(lane);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [assetsLoaded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyLaneMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
      const lane = keyLaneMap[e.key];
      if (lane === undefined) return;
      engineRef.current?.handleTap(lane);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showPerfHud) {
      setPerfSnapshot(null);
    }
  }, [showPerfHud]);

  useEffect(() => {
    return () => {
      stopLoop();
      audio.stopBgm();
    };
  }, []);

  if (!assetsLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full border-4 border-fuchsia-500 border-t-transparent animate-spin" />
          <div className="text-2xl animate-pulse font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-yellow-500">
            LOADING PINIK PIPRA...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="game-container"
      className="relative w-full h-full sm:max-w-md sm:h-[90vh] mx-auto bg-black overflow-hidden shadow-2xl sm:rounded-2xl sm:border border-white/10"
    >
      <GameHud
        score={score}
        highScore={highScore}
        isFeverMode={isFeverMode}
        feverProgress={feverProgress}
        comboMultiplier={comboMultiplier}
        shieldCharges={shieldCharges}
        slowMoActive={isSlowMoActive()}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        perfSnapshot={perfSnapshot}
        showPerfHud={showPerfHud}
      />

      <canvas
        data-testid="game-canvas"
        ref={canvasRef}
        className="block w-full h-full touch-none"
        data-reduced-motion={reducedMotion}
        onMouseDown={(e) => handleInteraction(e.clientX)}
        onTouchStart={(e) => {
          lastSwipeLaneRef.current = null;
          handleInteraction(e.touches[0]?.clientX ?? 0);
        }}
        onTouchMove={(e) => handleTouchMove(e.touches[0]?.clientX ?? 0)}
        onTouchEnd={() => {
          lastSwipeLaneRef.current = null;
        }}
      />

      <GameOverlay
        isPlaying={isPlaying}
        gameOver={gameOver}
        score={score}
        leaderboard={leaderboard}
        startGame={startGame}
      />
    </div>
  );
}
