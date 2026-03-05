import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../utils/audio';
import { useGameStore } from '../store/useGameStore';
import { ASSET_PATHS, GAME_SETTINGS } from '../constants';
import { preloadAssets } from '../utils/assetLoader';
import { calculateHitScore, findTopTargetInLane } from '../utils/gameplay';
import { logger } from '../utils/logger';
import { getLaneFromClientX } from '../utils/input';
import { calculateGameSpeed, calculateSpawnInterval, shouldActivateFeverMode } from '../utils/gameRules';
import { advancePsyEffects, moveInsects, updateScreenShake } from '../utils/loop';
import GameHud from './GameHud';
import GameOverlay from './GameOverlay';

interface Insect {
  id: number;
  lane: number;
  y: number;
  spriteIndex: number;
  speed: number;
  isFeverTarget?: boolean;
  cachedImage?: HTMLImageElement;
}

interface PsyEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  hue: number;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    score, highScore, gameOver, isPlaying, isFeverMode, feverProgress,
    startGame: startStoreGame
  } = useGameStore();

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const videosRef = useRef<HTMLVideoElement[]>([]);

  const state = useRef({
    insects: [] as Insect[],
    psyEffects: [] as PsyEffect[],
    speed: GAME_SETTINGS.INITIAL_SPEED,
    frames: 0,
    lastSpawnFrame: 0,
    hue: 0,
    insectIdCounter: 0,
    bgIndex: 0,
    shake: 0,
  });

  const requestRef = useRef<number | undefined>(undefined);

  const stopLoop = () => {
    if (requestRef.current !== undefined) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { images, videos } = await preloadAssets(
          Object.values(ASSET_PATHS.IMAGES),
          Object.values(ASSET_PATHS.ANIMATIONS)
        );
        imagesRef.current = images;
        videosRef.current = videos;
        setAssetsLoaded(true);
      } catch (error) {
        logger.error("Failed to load assets", error);
      }
    };
    load();
  }, []);

  const spawnInsect = () => {
    const lane = Math.floor(Math.random() * GAME_SETTINGS.LANE_COUNT);
    const spriteIndex = isFeverMode ? (Math.floor(Math.random() * 4) + 8) : Math.floor(Math.random() * 4);
    const cachedImage = imagesRef.current[spriteIndex];
    state.current.insects.push({
      id: state.current.insectIdCounter++,
      lane,
      y: -GAME_SETTINGS.TILE_HEIGHT,
      spriteIndex,
      speed: state.current.speed * (isFeverMode ? 1.5 : 1),
      isFeverTarget: isFeverMode,
      cachedImage,
    });
  };

  const startGame = () => {
    audio.init();
    audio.playBgm();
    stopLoop();
    startStoreGame();
    state.current = {
      insects: [],
      psyEffects: [],
      speed: GAME_SETTINGS.INITIAL_SPEED,
      frames: 0,
      lastSpawnFrame: 0,
      hue: 0,
      insectIdCounter: 0,
      bgIndex: Math.floor(Math.random() * 4) + 4,
      shake: 0,
    };
    requestRef.current = requestAnimationFrame(update);
  };

  const handleSuccessfulHit = (target: Insect, laneWidth: number) => {
    const { isFeverMode, addScore } = useGameStore.getState();
    state.current.insects = state.current.insects.filter(ins => ins.id !== target.id);
    addScore(calculateHitScore(isFeverMode));
    state.current.shake = isFeverMode ? 15 : 5;
    createPsyEffect(target.lane * laneWidth + laneWidth / 2, target.y + GAME_SETTINGS.TILE_HEIGHT / 2);
    audio.playTapSound(isFeverMode);
    videosRef.current.forEach(v => { if (v.paused) v.play().catch(() => {}); });
  };

  const popTopInsectInLane = (lane: number, laneWidth: number) => {
    const topInsect = findTopTargetInLane(state.current.insects, lane);
    if (!topInsect) return;
    handleSuccessfulHit(topInsect, laneWidth);
  };

  const createPsyEffect = (x: number, y: number) => {
    state.current.psyEffects.push({
      x, y, life: 0, maxLife: 30, hue: Math.random() * 360
    });
  };

  const update = () => {
    const { gameOver, isPlaying, score, isFeverMode, setFeverMode } = useGameStore.getState();
    if (gameOver || !isPlaying) {
      requestRef.current = undefined;
      return;
    }

    state.current.frames++;
    state.current.hue = (state.current.hue + (isFeverMode ? 5 : 1)) % 360;

    if (shouldActivateFeverMode(score, GAME_SETTINGS.FEVER_THRESHOLD, isFeverMode)) {
      setFeverMode(true);
      audio.playFeverActivation();
    }

    state.current.shake = updateScreenShake(state.current.shake, isFeverMode, state.current.frames);

    state.current.speed = calculateGameSpeed({
      score,
      initialSpeed: GAME_SETTINGS.INITIAL_SPEED,
      speedIncrement: GAME_SETTINGS.SPEED_INCREMENT,
      maxSpeed: GAME_SETTINGS.MAX_SPEED,
    });

    const spawnInterval = calculateSpawnInterval({ isFeverMode, score });
    if (state.current.frames - state.current.lastSpawnFrame > spawnInterval) {
      spawnInsect();
      state.current.lastSpawnFrame = state.current.frames;
    }

    const moved = moveInsects(
      state.current.insects,
      canvasRef.current?.height || 0,
      isFeverMode,
      GAME_SETTINGS.TILE_HEIGHT
    );
    state.current.insects = moved.insects;
    if (moved.reachedBottom && !isFeverMode) {
      useGameStore.getState().setGameOver(true);
      audio.playErrorSound();
      audio.stopBgm();
    }

    state.current.psyEffects = advancePsyEffects(state.current.psyEffects);

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const { isFeverMode } = useGameStore.getState();

    ctx.save();
    if (state.current.shake > 0) ctx.translate(Math.random() * state.current.shake, Math.random() * state.current.shake);

    if (isFeverMode) {
      ctx.fillStyle = `hsla(${state.current.hue}, 80%, 20%, 1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const video = videosRef.current[0];
      if (video && !video.paused) {
         ctx.globalAlpha = 0.5;
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         ctx.globalAlpha = 1.0;
      }
    } else {
      const bgImage = imagesRef.current[state.current.bgIndex];
      if (bgImage) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }

    ctx.fillStyle = `hsla(${state.current.hue}, 50%, 50%, ${isFeverMode ? 0.3 : 0.1})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const laneWidth = canvas.width / GAME_SETTINGS.LANE_COUNT;
    const intensity = isFeverMode;
    const currentHue = state.current.hue;
    const currentFrames = state.current.frames;
    for (const insect of state.current.insects) {
      const img = insect.cachedImage;
      if (img) {
        const size = GAME_SETTINGS.TILE_HEIGHT * (intensity ? 1.2 : 0.8);
        ctx.save();
        ctx.translate(insect.lane * laneWidth + laneWidth / 2, insect.y + GAME_SETTINGS.TILE_HEIGHT / 2);
        ctx.rotate(currentFrames * (intensity ? 0.2 : 0.05) * (insect.id % 2 === 0 ? 1 : -1));
        if (intensity) { ctx.shadowBlur = 20; ctx.shadowColor = `hsla(${currentHue}, 100%, 50%, 1)`; }
        ctx.drawImage(img, -size/2, -size/2, size, size);
        ctx.restore();
      }
    }

    for (const p of state.current.psyEffects) {
      const progress = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 1 - progress;
      ctx.rotate(progress * Math.PI * 2);
      ctx.font = `${30 + progress * 50}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const symbols = ['🍄', '🌀', '🧠', '✨', '🐜'];
      ctx.fillText(symbols[Math.floor(p.hue % symbols.length)], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };

  const handleInteraction = (clientX: number, clientY: number) => {
    const { isPlaying, gameOver } = useGameStore.getState();
    if (!isPlaying || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const laneWidth = canvas.width / GAME_SETTINGS.LANE_COUNT;
    const clickedLane = getLaneFromClientX(clientX, rect.left, canvas.width, GAME_SETTINGS.LANE_COUNT);
    if (clickedLane === -1) return;
    popTopInsectInLane(clickedLane, laneWidth);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resize = () => {
        if (canvas.parentElement) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
    }
  }, [assetsLoaded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyLaneMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
      const lane = keyLaneMap[e.key];
      if (lane === undefined) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const laneWidth = canvas.width / GAME_SETTINGS.LANE_COUNT;
      popTopInsectInLane(lane, laneWidth);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      stopLoop();
      audio.stopBgm();
    };
  }, []);

  if (!assetsLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <div className="text-2xl animate-pulse font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-yellow-500">LOADING PINIK PIPRA...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full sm:max-w-md sm:h-[90vh] mx-auto bg-black overflow-hidden shadow-2xl sm:rounded-2xl sm:border border-white/10">
      <GameHud score={score} highScore={highScore} isFeverMode={isFeverMode} feverProgress={feverProgress} />

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
        onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
      />

      <GameOverlay isPlaying={isPlaying} gameOver={gameOver} score={score} startGame={startGame} />
    </div>
  );
}
