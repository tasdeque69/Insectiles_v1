import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../utils/audio';
import { useGameStore } from '../store/useGameStore';
import { ASSET_PATHS, GAME_SETTINGS } from '../constants';
import { preloadAssets } from '../utils/assetLoader';
import { motion, AnimatePresence } from 'motion/react';

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
    addScore, setGameOver, startGame: startStoreGame, setFeverMode
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
        console.error("Failed to load assets", error);
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

  const createPsyEffect = (x: number, y: number) => {
    state.current.psyEffects.push({
      x, y, life: 0, maxLife: 30, hue: Math.random() * 360
    });
  };

  const update = () => {
    const { gameOver, isPlaying, score, isFeverMode, setFeverMode } = useGameStore.getState();
    if (gameOver || !isPlaying) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    state.current.frames++;
    state.current.hue = (state.current.hue + (isFeverMode ? 5 : 1)) % 360;

    if (score >= GAME_SETTINGS.FEVER_THRESHOLD && !isFeverMode) {
        setFeverMode(true);
        audio.playFeverActivation();
    }

    if (state.current.shake > 0) state.current.shake *= 0.9;
    if (isFeverMode && state.current.frames % 10 === 0) state.current.shake = 10;

    state.current.speed = Math.min(
      GAME_SETTINGS.INITIAL_SPEED + (score * GAME_SETTINGS.SPEED_INCREMENT),
      GAME_SETTINGS.MAX_SPEED
    );

    const baseInterval = isFeverMode ? 30 : 100;
    const spawnInterval = Math.max(20, baseInterval - Math.floor(score / 10));
    if (state.current.frames - state.current.lastSpawnFrame > spawnInterval) {
      spawnInsect();
      state.current.lastSpawnFrame = state.current.frames;
    }

    for (const insect of state.current.insects) {
      insect.y += insect.speed;
      const currentHeight = canvasRef.current?.height || 0;
      if (insect.y > currentHeight) {
        if (!isFeverMode) {
          useGameStore.getState().setGameOver(true);
          audio.playErrorSound();
          audio.stopBgm();
        } else {
          insect.y = -GAME_SETTINGS.TILE_HEIGHT;
        }
      }
    }

    for (let i = state.current.psyEffects.length - 1; i >= 0; i--) {
      state.current.psyEffects[i].life++;
      if (state.current.psyEffects[i].life >= state.current.psyEffects[i].maxLife) {
        state.current.psyEffects.splice(i, 1);
      }
    }

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
    const { isPlaying, gameOver, isFeverMode, addScore } = useGameStore.getState();
    if (!isPlaying || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const laneWidth = canvas.width / GAME_SETTINGS.LANE_COUNT;
    const clickedLane = Math.floor(x / laneWidth);
    const laneInsects = state.current.insects
      .filter(ins => ins.lane === clickedLane)
      .sort((a, b) => b.y - a.y);
    if (laneInsects.length > 0) {
      const target = laneInsects[0];
      state.current.insects = state.current.insects.filter(ins => ins.id !== target.id);
      addScore(isFeverMode ? 20 : 10);
      state.current.shake = isFeverMode ? 15 : 5;
      createPsyEffect(target.lane * laneWidth + laneWidth / 2, target.y + GAME_SETTINGS.TILE_HEIGHT / 2);
      audio.playTapSound(isFeverMode);
      videosRef.current.forEach(v => { if (v.paused) v.play().catch(() => {}); });
    }
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
      if (keyLaneMap.hasOwnProperty(e.key)) {
        const lane = keyLaneMap[e.key];
        const canvas = canvasRef.current;
        if (!canvas) return;
        const laneWidth = canvas.width / GAME_SETTINGS.LANE_COUNT;
        const laneInsects = state.current.insects
          .filter(ins => ins.lane === lane)
          .sort((a, b) => b.y - a.y);
        if (laneInsects.length > 0) {
          const target = laneInsects[0];
          const { isFeverMode, addScore } = useGameStore.getState();
          state.current.insects = state.current.insects.filter(ins => ins.id !== target.id);
          addScore(isFeverMode ? 20 : 10);
          state.current.shake = isFeverMode ? 15 : 5;
          createPsyEffect(target.lane * laneWidth + laneWidth / 2, target.y + GAME_SETTINGS.TILE_HEIGHT / 2);
          audio.playTapSound(isFeverMode);
          videosRef.current.forEach(v => { if (v.paused) v.play().catch(() => {}); });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      <div className="absolute top-4 left-0 right-0 z-10 flex flex-col px-6 pointer-events-none">
        <div className="flex justify-between items-start">
            <div className="text-white font-mono text-2xl drop-shadow-md flex flex-col">
            <motion.span animate={{ scale: isFeverMode ? [1, 1.1, 1] : 1 }} transition={{ repeat: Infinity, duration: 0.5 }}>
                Score: {score}
            </motion.span>
            {isFeverMode && (
                <span className="text-fuchsia-400 animate-pulse text-xl font-bold drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]">FEVER MODE!</span>
            )}
            </div>
            <div className="text-white/50 font-mono text-xl drop-shadow-md">Best: {highScore}</div>
        </div>
        {!isFeverMode && (
            <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden backdrop-blur-sm border border-white/5">
                <motion.div className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" initial={{ width: 0 }} animate={{ width: `${feverProgress * 100}%` }} />
            </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
        onTouchStart={(e) => handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}
      />

      <AnimatePresence>
      {(!isPlaying || gameOver) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
          <motion.h1 animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-yellow-500 mb-2 text-center drop-shadow-[0_0_20px_rgba(0,0,0,1)] transform -skew-x-6">PINIK<br/>PIPRA</motion.h1>
          {gameOver && (
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="mb-8 text-center">
              <p className="text-red-500 font-mono text-xl mb-2 tracking-tighter">TRIP ENDED (GAME OVER)</p>
              <p className="text-white font-mono text-4xl font-bold underline decoration-fuchsia-500">Score: {score}</p>
            </motion.div>
          )}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame} aria-label={gameOver ? "Restart game" : "Start game"} className="px-12 py-5 bg-white text-black font-black text-2xl rounded-full transition-shadow shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400">
            {gameOver ? 'RE-UP' : 'BEGIN TRIP'}
          </motion.button>
          <p className="mt-8 text-white/30 text-xs font-mono uppercase tracking-[0.2em]">"Get high with the ants"</p>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
