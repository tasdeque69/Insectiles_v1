import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audio } from '../utils/audio';
import { analytics } from '../utils/analytics';
import SoundSettings from './SoundSettings';
import Menu from './Menu';

const INSECT_DEFS = [
  { type: 'weed_ant', emojis: ['🌿', '🐜'] },
  { type: 'rainbow_ant', emojis: ['🐜'], rainbow: true },
  { type: 'neon_ant', emojis: ['🐜'], color: 'rgba(200, 0, 255, 0.8)' },
  { type: 'alien_bug', emojis: ['👽', '🐛'] },
  { type: 'fire_ice_ant', emojis: ['🐜'], gradient: ['rgba(255,0,0,0.8)', 'rgba(0,200,255,0.8)'] }
];
const SPECIAL_INSECT_DEF = { type: 'ladybug', emojis: ['🍁', '🐞'] };
const FEVER_SCORE_THRESHOLD = 500;
const FEVER_DURATION = 600;
const LANES = 4;
const INITIAL_SPEED = 3;
const SPEED_INCREMENT = 0.1;
const TILE_HEIGHT = 200;
const HIT_TOLERANCE = 100;

interface Insect {
  id: number;
  lane: number;
  y: number;
  def: typeof INSECT_DEFS[0];
  speed: number;
  scored: boolean;
}

interface PsyEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  hue: number;
  type: 'mandala' | 'buddha' | 'kaleidoscope' | 'profile';
}

interface GameState {
  insects: Insect[];
  psyEffects: PsyEffect[];
  speed: number;
  frames: number;
  lastSpawnFrame: number;
  hue: number;
  shake: number;
  flash: number;
  insectIdCounter: number;
  isPlaying: boolean;
  gameOver: boolean;
  score: number;
  feverMode: boolean;
  feverFramesLeft: number;
}

const createInitialState = (): GameState => ({
  insects: [],
  psyEffects: [],
  speed: INITIAL_SPEED,
  frames: 0,
  lastSpawnFrame: 0,
  hue: 0,
  shake: 0,
  flash: 0,
  insectIdCounter: 0,
  isPlaying: false,
  gameOver: false,
  score: 0,
  feverMode: false,
  feverFramesLeft: 0,
});

const EFFECTS_SYMBOLS: Record<string, string[]> = {
  mandala: ['👁️', '👅', '🖐️', '🍄', '🌀', '🧠'],
  buddha: ['🧘‍♂️'],
  kaleidoscope: [],
  profile: ['👽'],
};

class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private laneWidth: number;
  private cachedBassEnergy = 0;
  private cachedIntensity = 0;
  private frameSkipCounter = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.laneWidth = width / LANES;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.laneWidth = width / LANES;
  }

  clear(hue: number, feverMode: boolean, flash: number) {
    const alpha = feverMode ? 0.15 : 0.25;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = `hsl(${hue}, 60%, 15%)`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;

    if (flash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.3})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawBackground(state: GameState, freqData: Uint8Array | null, beat: number) {
    const { frames, hue, feverMode } = state;
    this.frameSkipCounter++;

    const shouldSkipHeavyEffects = this.frameSkipCounter % 2 !== 0;
    
    let bassEnergy = 0;
    if (freqData) {
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += freqData[i];
      }
      this.cachedBassEnergy = sum / 8 / 255;
      bassEnergy = this.cachedBassEnergy;
    }

    const intensity = audio.getVisualState().intensity;
    this.cachedIntensity = intensity;

    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    const pulse = bassEnergy * 30 * intensity;

    if (!shouldSkipHeavyEffects) {
      const numShapes = feverMode ? 10 : 6;
      const rotation = frames * 0.008 * (intensity || 1);
      ctx.rotate(rotation);

      ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 80%, 50%, ${0.15 * intensity})`;
      ctx.lineWidth = 2;

      for (let i = 0; i < numShapes; i++) {
        const radius = 80 + pulse + i * 25 + (feverMode ? 30 : 0);
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const angle = (j * Math.PI * 2) / 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (!shouldSkipHeavyEffects && freqData && intensity > 0.3) {
      ctx.rotate(-frames * 0.015);
      const numBars = 32;
      const visRadius = 100 + pulse;

      for (let i = 0; i < numBars; i++) {
        const barHeight = (freqData[i * 2] / 255) * 80 * intensity;
        const angle = (i * Math.PI * 2) / numBars;
        
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -visRadius);
        ctx.fillStyle = `hsla(${(hue + i * 8) % 360}, 100%, 50%, ${0.4 * intensity})`;
        ctx.fillRect(-1.5, -barHeight, 3, barHeight);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  drawLanes(state: GameState) {
    const ctx = this.ctx;
    const { hue, feverMode, frames } = state;
    const intensity = this.cachedIntensity;

    ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 100%, 60%, ${feverMode ? 0.8 : 0.5})`;
    ctx.lineWidth = feverMode ? 4 : 2;

    for (let i = 1; i < LANES; i++) {
      const x = i * this.laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
  }

  drawInsects(state: GameState) {
    const ctx = this.ctx;
    const { insects, hue, feverMode, frames } = state;
    const intensity = this.cachedIntensity;
    
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const insect of insects) {
      if (insect.scored) continue;

      const x = insect.lane * this.laneWidth;
      const y = insect.y;
      const laneCenterX = x + this.laneWidth / 2;

       const saturation = feverMode ? 55 : 25;
       ctx.fillStyle = `hsla(${(hue + insect.lane * 45) % 360}, 85%, ${saturation}%, 0.9)`;
       ctx.fillRect(x + 2, y - TILE_HEIGHT / 2 + 2, this.laneWidth - 4, TILE_HEIGHT - 4);
       
       ctx.strokeStyle = `hsla(${(hue + insect.lane * 45 + 180) % 360}, 100%, 75%, 1)`;
       ctx.lineWidth = 3;
       ctx.strokeRect(x + 2, y - TILE_HEIGHT / 2 + 2, this.laneWidth - 4, TILE_HEIGHT - 4);

      ctx.save();
      ctx.translate(laneCenterX, y);

      if (feverMode) {
        const scale = 1 + Math.sin(frames * 0.15) * 0.3;
        ctx.scale(scale, scale);
      }
      ctx.rotate(frames * 0.03 * (insect.id % 2 === 0 ? 1 : -1));

      const def = insect.def;
      
      if (def.type === 'weed_ant') {
        ctx.font = '40px Arial';
        ctx.fillText('🌿', 0, -12);
        ctx.fillText('🐜', 0, 12);
      } else if (def.type === 'alien_bug') {
        ctx.font = '40px Arial';
        ctx.fillText('👽', 0, -12);
        ctx.fillText('🐛', 0, 12);
      } else if (def.type === 'ladybug') {
        ctx.font = '48px Arial';
        ctx.fillText('🍁', 0, -12);
        ctx.fillText('🐞', 0, 12);
      } else {
        ctx.fillText('🐜', 0, 0);
      }

      ctx.restore();
    }
  }

  drawPsyEffects(state: GameState) {
    const ctx = this.ctx;
    const { psyEffects, hue } = state;

    for (const p of psyEffects) {
      const progress = p.life / p.maxLife;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);

      if (p.type === 'mandala') {
        ctx.rotate(progress * Math.PI * 2);
        ctx.font = `${20 + progress * 30}px Arial`;
        const symbols = EFFECTS_SYMBOLS.mandala;
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 3);
          ctx.fillText(symbols[i % symbols.length], 0, -40 - progress * 30);
          ctx.restore();
        }
        ctx.font = `${35 + progress * 50}px Arial`;
        ctx.fillText('👹', 0, 0);
      } else if (p.type === 'kaleidoscope') {
        ctx.rotate(progress * Math.PI);
        const outer = progress * 150;
        const inner = progress * 50;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? outer : inner;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `hsla(${(p.hue) % 360}, 100%, 50%, ${alpha * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${(p.hue + 180) % 360}, 100%, 50%, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.type === 'buddha') {
        ctx.rotate(-progress * Math.PI * 0.5);
        ctx.font = `${50 + progress * 40}px Arial`;
        ctx.fillText('🧘‍♂️', 0, 0);
      } else if (p.type === 'profile') {
        ctx.font = `${60 + progress * 30}px Arial`;
        ctx.fillText('👽', 0, 0);
      }

      ctx.restore();
    }
  }

  drawShake(state: GameState) {
    if (state.shake > 0.5) {
      const dx = (Math.random() - 0.5) * state.shake;
      const dy = (Math.random() - 0.5) * state.shake;
      this.ctx.translate(dx, dy);
      state.shake *= 0.85;
      if (state.shake < 0.5) state.shake = 0;
    }
  }
}

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const lastInputTime = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const state = useRef<GameState>(createInitialState());
  const requestRef = useRef<number | undefined>(undefined);
  const updateRef = useRef<() => void>(() => {});

  const spawnInsect = useCallback(() => {
    const lane = Math.floor(Math.random() * LANES);
    const isFever = state.current.feverMode;
    const def = isFever ? SPECIAL_INSECT_DEF : INSECT_DEFS[Math.floor(Math.random() * INSECT_DEFS.length)];
    state.current.insects.push({
      id: state.current.insectIdCounter++,
      lane,
      y: -100,
      def,
      speed: state.current.speed,
      scored: false,
    });
  }, []);

  const startGame = useCallback(() => {
    audio.init();
    audio.playBgm();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    state.current = createInitialState();
    state.current.isPlaying = true;
    spawnInsect();

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(() => updateRef.current());

    analytics.init();
    analytics.trackGameStart(1);
  }, [spawnInsect]);

  const endGame = useCallback(() => {
    audio.playErrorSound();
    audio.stopBgm();
    setIsPlaying(false);
    setGameOver(true);
    state.current.isPlaying = false;
    state.current.gameOver = true;
    const finalScore = state.current.score;
    const duration = state.current.frames / 60;
    setHighScore((prev) => Math.max(prev, finalScore));
    analytics.trackGameEnd(finalScore, 1, duration);
  }, []);

  const handleInput = useCallback((clientX: number, clientY: number) => {
    if (audio.ctx && audio.ctx.state === 'suspended') {
      audio.ctx.resume();
    }

    if (!state.current.isPlaying || state.current.gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const now = Date.now();
    if (now - lastInputTime.current < 40) return;
    lastInputTime.current = now;

    const laneWidth = canvas.width / LANES;
    const clickedLane = Math.floor(x / laneWidth);

    const targetInsect = state.current.insects
      .filter((i) => i.lane === clickedLane && !i.scored)
      .sort((a, b) => b.y - a.y)[0];

    const lowestOverall = state.current.insects
      .filter((i) => !i.scored)
      .sort((a, b) => b.y - a.y)[0];

    const isWithinVerticalRange = targetInsect && 
      Math.abs(y - targetInsect.y) < (TILE_HEIGHT + HIT_TOLERANCE);

    if (targetInsect && targetInsect === lowestOverall && isWithinVerticalRange) {
      targetInsect.scored = true;
      const isSpecial = targetInsect.def.type === 'ladybug';

      analytics.trackMatch(targetInsect.def.type, isSpecial ? 2 : 1);

      const prevScore = state.current.score;
      state.current.score += isSpecial ? 2 : 1;

      if (!state.current.feverMode && 
          Math.floor(prevScore / FEVER_SCORE_THRESHOLD) < 
          Math.floor(state.current.score / FEVER_SCORE_THRESHOLD)) {
        state.current.feverMode = true;
        state.current.feverFramesLeft = FEVER_DURATION;
      }

      state.current.speed = INITIAL_SPEED + state.current.score * SPEED_INCREMENT;

      const effectX = clickedLane * laneWidth + laneWidth / 2;
      const effectY = targetInsect.y;
      
      state.current.psyEffects.push({
        x: effectX,
        y: effectY,
        life: 0,
        maxLife: 25,
        hue: (state.current.hue + 180) % 360,
        type: 'kaleidoscope',
      });

      state.current.psyEffects.push({
        x: effectX,
        y: effectY + 40,
        life: 0,
        maxLife: 45,
        hue: state.current.hue,
        type: ['mandala', 'buddha', 'kaleidoscope', 'profile'][Math.floor(Math.random() * 4)] as PsyEffect['type'],
      });

      state.current.shake = isSpecial ? 30 : 18;
      state.current.flash = isSpecial ? 0.6 : 0.3;
      state.current.hue += isSpecial ? 45 : 25;

      setScore(state.current.score);
      audio.playTapSound(isSpecial);
    } else {
      endGame();
    }
  }, [endGame]);

  const update = useCallback(() => {
    if (!state.current.isPlaying || state.current.gameOver) {
      requestRef.current = undefined;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      requestRef.current = requestAnimationFrame(() => updateRef.current());
      return;
    }

    if (canvas.width === 0 || canvas.height === 0) {
      requestRef.current = requestAnimationFrame(() => updateRef.current());
      return;
    }

    if (!rendererRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        rendererRef.current = new Renderer(ctx, canvas.width, canvas.height);
      }
    }

    state.current.frames++;
    state.current.hue = (state.current.hue + (state.current.feverMode ? 1.5 : 0.4)) % 360;

    if (state.current.feverFramesLeft > 0) {
      state.current.feverFramesLeft--;
      if (state.current.feverFramesLeft <= 0) {
        state.current.feverMode = false;
      }
    }

    const spawnDistance = 220;
    const currentSpawnRate = Math.max(8, spawnDistance / state.current.speed);
    if (state.current.frames - state.current.lastSpawnFrame > currentSpawnRate) {
      spawnInsect();
      state.current.lastSpawnFrame = state.current.frames;
    }

    for (let i = state.current.insects.length - 1; i >= 0; i--) {
      const insect = state.current.insects[i];
      if (!insect.scored) {
        insect.y += state.current.speed;
        if (insect.y + TILE_HEIGHT / 2 >= canvas.height) {
          endGame();
          return;
        }
      } else {
        state.current.insects.splice(i, 1);
      }
    }

    for (let i = state.current.psyEffects.length - 1; i >= 0; i++) {
      state.current.psyEffects[i].life++;
      if (state.current.psyEffects[i].life >= state.current.psyEffects[i].maxLife) {
        state.current.psyEffects.splice(i, 1);
      }
    }

    if (state.current.flash > 0) {
      state.current.flash -= 0.08;
      if (state.current.flash < 0) state.current.flash = 0;
    }

    const ctx = canvas.getContext('2d');
    if (ctx && rendererRef.current) {
      rendererRef.current.clear(state.current.hue, state.current.feverMode, state.current.flash);
      rendererRef.current.drawBackground(state.current, audio.getFrequencyData(), audio.getVisualState().beat);
      rendererRef.current.drawLanes(state.current);
      rendererRef.current.drawInsects(state.current);
      rendererRef.current.drawPsyEffects(state.current);
      rendererRef.current.drawShake(state.current);
    }

    requestRef.current = requestAnimationFrame(() => updateRef.current());
  }, [spawnInsect, endGame]);

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        if (rendererRef.current) {
          rendererRef.current.resize(canvas.width, canvas.height);
        }
      }
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
    resize();

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInput(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      handleInput(touch.clientX, touch.clientY);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full sm:max-w-md sm:h-[90vh] mx-auto bg-black overflow-hidden shadow-2xl sm:rounded-2xl sm:border border-white/10">
      <div className="absolute top-4 left-0 right-0 z-10 flex justify-between px-6 pointer-events-none">
        <div className="text-white font-mono text-2xl drop-shadow-md flex flex-col">
          <span>Score: {score}</span>
          {state.current.feverMode && (
            <span className="text-fuchsia-400 animate-pulse text-xl font-bold">FEVER!</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white/50 font-mono text-xl drop-shadow-md">
            Best: {highScore}
          </div>
          <div className="pointer-events-auto">
            <SoundSettings />
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />

      {!isPlaying && !gameOver && (
        <Menu onStartGame={startGame} highScore={highScore} />
      )}

      {gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-fuchsia-500 to-red-500 mb-4 text-center drop-shadow-lg animate-pulse">
            GAME OVER
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-white font-mono text-4xl mb-2">{score}</p>
            <p className="text-white/50 font-mono text-sm">POINTS</p>
          </div>

          {score >= highScore && score > 0 && (
            <div className="mb-6 px-6 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
              <span className="text-yellow-400 font-bold">NEW HIGH SCORE!</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              PLAY AGAIN
            </button>
            <button
              onClick={() => { setGameOver(false); setIsPlaying(false); }}
              className="px-6 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 border border-white/20"
            >
              MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
