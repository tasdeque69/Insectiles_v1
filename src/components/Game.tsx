import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../utils/audio';
import { assetLoader, ASSETS } from '../utils/assetLoader';

const INSECT_DEFS = [
  { type: 'weed_ant', sprites: ASSETS.insects, spriteIndex: 0 },
  { type: 'rainbow_ant', sprites: ASSETS.insects, spriteIndex: 1 },
  { type: 'neon_ant', sprites: ASSETS.insects, spriteIndex: 2 },
  { type: 'alien_bug', sprites: ASSETS.insects, spriteIndex: 3 },
  { type: 'fire_ice_ant', sprites: ASSETS.insects, spriteIndex: 0 },
];
const SPECIAL_INSECT_DEF = { type: 'ladybug', sprites: ASSETS.insects, spriteIndex: 1 };
const FEVER_SCORE_THRESHOLD = 500;
const FEVER_DURATION = 600; // frames (about 10 seconds at 60fps)
const LANES = 4;
const INITIAL_SPEED = 3;
const SPEED_INCREMENT = 0.1;
const SPAWN_RATE = 100; // frames between spawns initially

interface InsectDef {
  type: string;
  sprites: readonly string[];
  spriteIndex: number;
  color?: string;
  gradient?: string[];
}

interface Insect {
  id: number;
  lane: number;
  y: number;
  def: InsectDef;
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

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastInputTime = useRef<number>(0);
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game state refs for the animation loop
  const state = useRef({
    insects: [] as Insect[],
    psyEffects: [] as PsyEffect[],
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

  const requestRef = useRef<number | undefined>(undefined);
  const updateRef = useRef<() => void>(() => {});

  useEffect(() => {
    updateRef.current = update;
  });

  const spawnInsect = () => {
    const lane = Math.floor(Math.random() * LANES);
    const isFever = state.current.feverMode;
    const def = isFever ? SPECIAL_INSECT_DEF : INSECT_DEFS[Math.floor(Math.random() * INSECT_DEFS.length)];
    state.current.insects.push({
      id: state.current.insectIdCounter++,
      lane,
      y: -100, // Start above screen
      def,
      speed: state.current.speed,
      scored: false,
    });
  };

const startGame = async () => {
    await assetLoader.load();
    audio.init();
    audio.playBgm();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    state.current = {
      insects: [],
      psyEffects: [],
      speed: INITIAL_SPEED,
      frames: 0,
      lastSpawnFrame: 0,
      hue: 0,
      shake: 0,
      flash: 0,
      insectIdCounter: 0,
      isPlaying: true,
      gameOver: false,
      score: 0,
      feverMode: false,
      feverFramesLeft: 0,
    };
    // Spawn first insect immediately
    spawnInsect();
    
    // Start loop if not already running
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(() => updateRef.current());
  };

  const endGame = () => {
    audio.playErrorSound();
    audio.stopBgm();
    setIsPlaying(false);
    setGameOver(true);
    state.current.isPlaying = false;
    state.current.gameOver = true;
    setHighScore((prev) => Math.max(prev, state.current.score));
  };

  const handleInput = (clientX: number, clientY: number) => {
    // Ensure audio context is resumed on any interaction
    if (audio.ctx && audio.ctx.state === 'suspended') {
      audio.ctx.resume();
    }

    if (!state.current.isPlaying || state.current.gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    // Debounce inputs but allow slightly faster tapping
    const now = Date.now();
    if (now - lastInputTime.current < 30) return;
    lastInputTime.current = now;

    const laneWidth = canvas.width / LANES;
    const clickedLane = Math.floor(x / laneWidth);

    // Hit detection with a bit of vertical tolerance for better mobile feel
    const HIT_TOLERANCE = 100; 

    // Find the lowest unscored insect in the clicked lane
    const targetInsect = state.current.insects
      .filter((i) => i.lane === clickedLane && !i.scored)
      .sort((a, b) => b.y - a.y)[0];

    // Check if there's an insect lower in ANY other lane
    const lowestOverall = state.current.insects
      .filter((i) => !i.scored)
      .sort((a, b) => b.y - a.y)[0];

    // Check if the tap is within a reasonable vertical range of the lowest tile
    const isWithinVerticalRange = targetInsect && Math.abs(y - targetInsect.y) < (200 + HIT_TOLERANCE);

    if (targetInsect && targetInsect === lowestOverall && isWithinVerticalRange) {
      state.current.psyEffects.push({
        x,
        y,
        life: 0,
        maxLife: 30,
        hue: (state.current.hue + 180) % 360,
        type: 'kaleidoscope'
      });

      // Valid tap
      targetInsect.scored = true;
      const isSpecial = targetInsect.def.type === 'ladybug';
      
      setScore((s) => {
        const prevScore = s;
        const newScore = s + (isSpecial ? 2 : 1);
        state.current.score = newScore;
        
        // Check for fever mode trigger
        if (!state.current.feverMode && newScore > 0 && Math.floor(prevScore / FEVER_SCORE_THRESHOLD) < Math.floor(newScore / FEVER_SCORE_THRESHOLD)) {
          state.current.feverMode = true;
          state.current.feverFramesLeft = FEVER_DURATION;
        }
        
        state.current.speed = INITIAL_SPEED + newScore * SPEED_INCREMENT;
        return newScore;
      });
      audio.playTapSound(isSpecial);
      
      // Psychedelic effects
      state.current.shake = isSpecial ? 40 : 25;
      state.current.flash = isSpecial ? 0.8 : 0.4;
      state.current.hue += isSpecial ? 60 : 30;

      // Psychedelic Trans Effect
      const effectTypes: ('mandala' | 'buddha' | 'kaleidoscope' | 'profile')[] = ['mandala', 'buddha', 'kaleidoscope', 'profile'];
      const randomType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
      
      state.current.psyEffects.push({
        x: clickedLane * laneWidth + laneWidth / 2,
        y: targetInsect.y + 40,
        life: 0,
        maxLife: 60,
        hue: state.current.hue,
        type: randomType
      });
    } else {
      // Missed tap or wrong order
      endGame();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInput(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only process if we have touches
    if (e.touches.length > 0) {
      // Prevent default to stop ghost clicks and scrolling
      if (e.cancelable) e.preventDefault();
      
      const touch = e.touches[0];
      handleInput(touch.clientX, touch.clientY);
    }
  };

  const update = () => {
    if (!state.current.isPlaying || state.current.gameOver) {
      requestRef.current = undefined;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    // Ensure canvas has dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      const parent = canvas.parentElement;
      if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        requestRef.current = requestAnimationFrame(update);
        return;
      }
    }

    state.current.frames++;
    state.current.hue = (state.current.hue + (state.current.feverMode ? 2 : 0.5)) % 360;

    if (state.current.feverFramesLeft > 0) {
      state.current.feverFramesLeft--;
      if (state.current.feverFramesLeft <= 0) {
        state.current.feverMode = false;
      }
    }

    // Spawn logic
    const distanceBetweenInsects = 250;
    const currentSpawnRate = Math.max(10, distanceBetweenInsects / state.current.speed);
    if (state.current.frames - state.current.lastSpawnFrame > currentSpawnRate) {
      spawnInsect();
      state.current.lastSpawnFrame = state.current.frames;
    }

    // Update insects
    for (let i = state.current.insects.length - 1; i >= 0; i--) {
      const insect = state.current.insects[i];
      if (!insect.scored) {
        insect.y += state.current.speed;
        // Game over if insect reaches bottom
        const tileHeight = 200;
        if (insect.y + tileHeight / 2 >= canvas.height) {
          endGame();
          return;
        }
      } else {
        // Remove scored insects after they fall off screen or immediately
        state.current.insects.splice(i, 1);
      }
    }

    // Update psyEffects
    for (let i = state.current.psyEffects.length - 1; i >= 0; i--) {
      const p = state.current.psyEffects[i];
      p.life++;
      if (p.life >= p.maxLife) {
        state.current.psyEffects.splice(i, 1);
      }
    }



    // Draw
    draw(ctx, canvas);

    requestRef.current = requestAnimationFrame(() => updateRef.current());
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save();
    const isFever = state.current.feverMode;
    const visualState = audio.getVisualState();
    const { section, intensity, beat, total16ths } = visualState;
    const freqData = audio.getFrequencyData();

    let bassEnergy = 0;
    if (freqData) {
      for (let i = 0; i < 10; i++) {
        bassEnergy += freqData[i];
      }
      bassEnergy /= 10;
    }
    
    // Use bassEnergy to drive pulse and flash
    const pulse = (bassEnergy / 255) * 50 * intensity;

    // Dynamic saturation and lightness based on music intensity and bass
    const dynamicSaturation = 50 + (intensity * 30) + ((bassEnergy / 255) * 20);
    const dynamicLightness = 5 + (intensity * 10) + ((bassEnergy / 255) * 15);

    // Create a color-shifting gradient background
    const bgGradient = ctx.createLinearGradient(
      canvas.width / 2 + Math.cos(state.current.frames * 0.005) * canvas.width,
      canvas.height / 2 + Math.sin(state.current.frames * 0.005) * canvas.height,
      canvas.width / 2 - Math.cos(state.current.frames * 0.005) * canvas.width,
      canvas.height / 2 - Math.sin(state.current.frames * 0.005) * canvas.height
    );
    
    bgGradient.addColorStop(0, `hsla(${state.current.hue}, ${dynamicSaturation}%, ${dynamicLightness}%, 1)`);
    bgGradient.addColorStop(0.5, `hsla(${(state.current.hue + 60 * intensity) % 360}, ${dynamicSaturation}%, ${dynamicLightness * 0.8}%, 1)`);
    bgGradient.addColorStop(1, `hsla(${(state.current.hue + 120 * intensity + (bassEnergy / 255) * 60) % 360}, ${dynamicSaturation}%, ${dynamicLightness * 1.2}%, 1)`);

    // Clear with psychedelic trail effect
    ctx.globalAlpha = isFever ? 0.1 : 0.3;
    
    // Try to use background image, fall back to gradient
    const bgPath = assetLoader.getRandomFromCategory('backgrounds');
    const bgImage = bgPath ? assetLoader.get(bgPath) : null;
    
    if (bgImage && bgImage.complete) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.globalAlpha = 1.0;

    // Beat flash based on bass energy
    if (bassEnergy > 200 && state.current.frames % 4 === 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * intensity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply shake to the drawing context instead of the DOM element
    if (state.current.shake > 0) {
      const dx = (Math.random() - 0.5) * state.current.shake;
      const dy = (Math.random() - 0.5) * state.current.shake;
      ctx.translate(dx, dy);
      state.current.shake *= 0.9;
      if (state.current.shake < 0.5) state.current.shake = 0;
    }

    // Draw dynamic background patterns
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotating geometric shapes
    const numShapes = section === 2 ? 12 : (section === 1 ? 8 : 6);
    const geomPulse = Math.sin(state.current.frames * 0.1 + beat * Math.PI / 4) * 20 * intensity;
    
    ctx.rotate(state.current.frames * 0.01 * intensity * (section === 3 ? -1 : 1));
    
    for (let i = 0; i < numShapes; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / numShapes);
      
      // Draw a fractal-like star/polygon
      ctx.beginPath();
      const radius = 100 + geomPulse + pulse + (i * 10 * intensity) + (isFever ? 50 : 0);
      for (let j = 0; j < 5; j++) {
        const angle = (j * Math.PI * 2) / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      
      ctx.strokeStyle = `hsla(${(state.current.hue + i * 20 + total16ths * 2) % 360}, 80%, 50%, ${0.2 * intensity})`;
      ctx.lineWidth = 2 + intensity * 2;
      ctx.stroke();
      
      // Fill in drop section
      if (section === 2 && i % 2 === 0) {
        ctx.fillStyle = `hsla(${(state.current.hue + i * 30) % 360}, 100%, 50%, 0.1)`;
        ctx.fill();
      }
      ctx.restore();
    }
    
    // Swirling fractals (spiral)
    if (section === 1 || section === 2 || isFever) {
      ctx.save();
      ctx.rotate(-state.current.frames * 0.02 * intensity);
      ctx.beginPath();
      for (let i = 0; i < 150; i++) {
        const angle = 0.1 * i * (1 + intensity * 0.5) + state.current.frames * 0.05;
        const r = Math.max(0, 4 * i * (isFever ? 1.5 : 1) + (freqData ? freqData[i % freqData.length] / 5 : 0));
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${(state.current.hue + 180) % 360}, 100%, 50%, ${0.3 * intensity})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw circular spectrum visualizer
    if (freqData) {
      ctx.save();
      const numBars = 64;
      const visRadius = 150 + pulse;
      for (let i = 0; i < numBars; i++) {
        const barHeight = (freqData[i] / 255) * 150 * intensity;
        const angle = (i * Math.PI * 2) / numBars + state.current.frames * 0.01;
        
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -visRadius);
        
        ctx.fillStyle = `hsla(${(state.current.hue + i * 5) % 360}, 100%, 50%, ${0.5 * intensity})`;
        ctx.fillRect(-2, -barHeight, 4, barHeight);
        
        // Mirror inward
        ctx.fillStyle = `hsla(${(state.current.hue + i * 5 + 180) % 360}, 100%, 50%, ${0.2 * intensity})`;
        ctx.fillRect(-2, 0, 4, barHeight * 0.5);
        
        ctx.restore();
      }
      ctx.restore();
    }
    
    ctx.restore();

    // Apply shake
    ctx.save();

    // Draw lanes
    const laneWidth = canvas.width / LANES;
    ctx.strokeStyle = `hsla(${(state.current.hue + 180) % 360}, 100%, 70%, 0.6)`;
    ctx.lineWidth = isFever ? 6 : 4;
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      for (let y = 0; y <= canvas.height; y += 20) {
        const wave = Math.sin(y * 0.01 + state.current.frames * 0.1) * ((isFever ? 30 : 10) * intensity);
        const x = i * laneWidth + wave;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw insects
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add some glow to insects
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsl(${state.current.hue}, 100%, 50%)`;

    state.current.insects.forEach((insect) => {
      if (!insect.scored) {
        const tileHeight = 200;
        const wave = Math.sin(insect.y * 0.01 + state.current.frames * 0.1) * ((isFever ? 30 : 10) * intensity);
        const xOffset = wave;

        // Draw tile background with high opacity and a bright border for visibility
        ctx.fillStyle = `hsla(${(state.current.hue + insect.lane * 45) % 360}, 90%, ${isFever ? '60%' : '30%'}, 0.95)`;
        ctx.fillRect(insect.lane * laneWidth + xOffset, insect.y - tileHeight / 2, laneWidth, tileHeight);
        
        ctx.strokeStyle = `hsla(${(state.current.hue + insect.lane * 45 + 180) % 360}, 100%, 80%, 1)`;
        ctx.lineWidth = 4;
        ctx.strokeRect(insect.lane * laneWidth + xOffset, insect.y - tileHeight / 2, laneWidth, tileHeight);
        
        // Draw insect emoji
        ctx.save();
        ctx.translate(insect.lane * laneWidth + laneWidth / 2 + xOffset, insect.y);
        
        let scale = 1;
        if (isFever) {
            scale = 1 + Math.sin(state.current.frames * 0.2) * 0.5;
        }
        ctx.scale(scale, scale);
        ctx.rotate(state.current.frames * (isFever ? 0.2 : 0.05) * (insect.id % 2 === 0 ? 1 : -1));
        
        const def = insect.def;
        
        // Try to use sprite, fall back to emoji
        const spritePath = def.sprites ? def.sprites[def.spriteIndex % def.sprites.length] : null;
        const sprite = spritePath ? assetLoader.get(spritePath) : null;
        
        if (sprite && sprite.complete) {
          ctx.drawImage(sprite, -40, -40, 80, 80);
        } else if (def.type === 'weed_ant') {
          ctx.font = '50px Arial';
          ctx.fillText('🌿', 0, -15);
          ctx.fillText('🐜', 0, 15);
        } else if (def.type === 'alien_bug') {
          ctx.font = '50px Arial';
          ctx.fillText('👽', 0, -15);
          ctx.fillText('🐛', 0, 15);
        } else if (def.type === 'ladybug') {
          ctx.font = '60px Arial';
          ctx.fillText('🍁', 0, -15);
          ctx.fillText('🐞', 0, 15);
        } else if (offscreenCanvas.current) {
          const offCtx = offscreenCanvas.current.getContext('2d');
          if (offCtx) {
            offCtx.clearRect(0, 0, 100, 100);
            offCtx.font = '60px Arial';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText('🐜', 50, 50);
            
            offCtx.globalCompositeOperation = 'source-atop';
            
            if (def.type === 'rainbow_ant') {
              offCtx.fillStyle = `hsla(${(state.current.frames * 10) % 360}, 100%, 50%, 0.6)`;
              offCtx.fillRect(0, 0, 100, 100);
            } else if (def.type === 'neon_ant') {
              offCtx.fillStyle = def.color;
              offCtx.fillRect(0, 0, 100, 100);
            } else if (def.type === 'fire_ice_ant') {
              const grad = offCtx.createLinearGradient(0, 0, 100, 100);
              grad.addColorStop(0, def.gradient[0]);
              grad.addColorStop(1, def.gradient[1]);
              offCtx.fillStyle = grad;
              offCtx.fillRect(0, 0, 100, 100);
            }
            
            offCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(offscreenCanvas.current, -50, -50);
          }
        }
        
        ctx.restore();
      }
    });

    ctx.shadowBlur = 0; // Reset shadow

    // Draw psyEffects
    state.current.psyEffects.forEach((p) => {
      const progress = p.life / p.maxLife;
      const scale = progress * 10;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = alpha;
      
      if (p.type === 'mandala') {
        ctx.rotate(progress * Math.PI * 4);
        const symbols = ['👁️', '👅', '🖐️', '🍄', '🌀', '🧠'];
        const numArms = 8;
        
        for (let i = 0; i < numArms; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI * 2) / numArms);
          ctx.font = `${20 + progress * 40}px Arial`;
          ctx.fillText(symbols[i % symbols.length], 0, -50 * scale);
          ctx.restore();
        }
        
        ctx.font = `${40 + progress * 80}px Arial`;
        ctx.fillText('👹', 0, 0);
      } else if (p.type === 'buddha') {
        ctx.rotate(progress * Math.PI);
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const radius = (progress * 150) + (i * 20);
          for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const wave = Math.sin(angle * 10 + progress * 20) * 15;
            const r = radius + wave;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = `hsla(${(p.hue + i * 40) % 360}, 100%, 50%, ${alpha})`;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.font = `${60 + progress * 60}px Arial`;
        ctx.fillText('🧘‍♂️', 0, 0);
      } else if (p.type === 'kaleidoscope') {
        const points = 8;
        const outerRadius = progress * 250;
        const innerRadius = progress * 80;
        
        for(let j = 0; j < 4; j++) {
          ctx.beginPath();
          for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius - (j*40) : innerRadius - (j*15);
            const angle = (i * Math.PI) / points + (progress * Math.PI * (j % 2 === 0 ? 1 : -1));
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = `hsla(${(p.hue + j * 60 + progress * 200) % 360}, 100%, 50%, ${alpha * 0.6})`;
          ctx.fill();
          ctx.strokeStyle = `hsla(${(p.hue + j * 60 + 180) % 360}, 100%, 50%, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else if (p.type === 'profile') {
        ctx.rotate(-progress * Math.PI * 0.5);
        ctx.font = `${70 + progress * 50}px Arial`;
        ctx.fillText('👽', 0, 0);
        
        for (let i = 0; i < 16; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const angle = (i * Math.PI * 2) / 16 + progress * 2;
          const cp1x = Math.cos(angle - 1) * 150 * progress;
          const cp1y = Math.sin(angle - 1) * 150 * progress;
          const cp2x = Math.cos(angle + 1) * 250 * progress;
          const cp2y = Math.sin(angle + 1) * 250 * progress;
          const x = Math.cos(angle) * 350 * progress;
          const y = Math.sin(angle) * 350 * progress;
          
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
          ctx.strokeStyle = `hsla(${(p.hue + i * 25) % 360}, 100%, 50%, ${alpha})`;
          ctx.lineWidth = 5;
          ctx.stroke();
        }
      }
      
      ctx.restore();
    });

    // Flash effect
    if (state.current.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.current.flash})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      state.current.flash -= 0.1;
      if (state.current.flash < 0) state.current.flash = 0;
    }

    ctx.restore();
    ctx.restore();
  };

  useEffect(() => {
    offscreenCanvas.current = document.createElement('canvas');
    offscreenCanvas.current.width = 100;
    offscreenCanvas.current.height = 100;

    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas size to match container
      const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      };
      window.addEventListener('resize', resize);
      // Small delay to ensure parent has dimensions on mobile
      setTimeout(resize, 100);
      resize();

      // Initial draw
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full sm:max-w-md sm:h-[90vh] mx-auto bg-black overflow-hidden shadow-2xl sm:rounded-2xl sm:border border-white/10">
      {/* Score Display */}
      <div className="absolute top-4 left-0 right-0 z-10 flex justify-between px-6 pointer-events-none">
        <div className="flex items-center gap-3">
          <img 
            src="/Pink_ant_mascot_game_sprite_3379ebd6e6.jpeg" 
            alt="Mascot" 
            className="w-12 h-12 rounded-full border-2 border-white/30"
          />
          <div className="text-white font-mono text-2xl drop-shadow-md flex flex-col">
            <span>Score: {score}</span>
            {state.current.feverMode && (
              <span className="text-fuchsia-400 animate-pulse text-xl font-bold">FEVER MODE!</span>
            )}
          </div>
        </div>
        <div className="text-white/50 font-mono text-xl drop-shadow-md">
          Best: {highScore}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />

      {/* Start / Game Over Overlay */}
      {(!isPlaying || gameOver) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-yellow-500 mb-2 text-center drop-shadow-lg transform -skew-x-6">
            INSECT<br/>TILES
          </h1>
          
          {gameOver && (
            <div className="mb-8 text-center animate-bounce">
              <p className="text-red-500 font-mono text-xl mb-2">GAME OVER</p>
              <p className="text-white font-mono text-3xl">Score: {score}</p>
            </div>
          )}

          {!gameOver && (
            <p className="text-white/70 mb-8 max-w-xs text-center text-sm">
              Tap the lowest insect before it reaches the bottom. Don't tap empty lanes!
            </p>
          )}

          <button
            onClick={startGame}
            className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          >
            {gameOver ? 'PLAY AGAIN' : 'START GAME'}
          </button>
        </div>
      )}
    </div>
  );
}
