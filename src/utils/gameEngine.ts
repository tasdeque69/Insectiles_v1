import { calculateGameSpeed, calculateSpawnInterval, shouldActivateFeverMode } from '../utils/gameRules';
import { advancePsyEffects, moveInsects, updateScreenShake } from '../utils/loop';
import { findTopTargetInLane } from '../utils/gameplay';

export interface Insect {
  id: number;
  lane: number;
  y: number;
  spriteIndex: number;
  speed: number;
  isFeverTarget?: boolean;
  cachedImage?: HTMLImageElement;
}

export interface PowerUp {
  id: number;
  lane: number;
  y: number;
  type: 'shield' | 'slowmo';
}

export interface PsyEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  hue: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GameEngineConfig {
  laneCount: number;
  tileHeight: number;
  initialSpeed: number;
  speedIncrement: number;
  maxSpeed: number;
  feverThreshold: number;
}

export interface EngineCallbacks {
  getScore: () => number;
  getIsFeverMode: () => boolean;
  getIsPlaying: () => boolean;
  getGameOver: () => boolean;
  getIsSlowMo: () => boolean;
  getSoundEnabled: () => boolean;
  setFeverMode: (active: boolean) => void;
  addScore: (points: number) => void;
  setGameOver: (over: boolean) => void;
  addLeaderboardScore: (score: number) => void;
  recordHit: () => number;
  recordMiss: () => void;
  consumeShield: () => boolean;
  activateShield: () => void;
  activateSlowMo: (durationMs: number) => void;
  playFeverActivation: () => void;
  playTapSound: (isFever: boolean) => void;
  playErrorSound: () => void;
  stopBgm: () => void;
}

export class GameEngine {
  private config: GameEngineConfig;
  private callbacks: EngineCallbacks;
  private canvas: HTMLCanvasElement;
  private images: HTMLImageElement[];

  private insects: Insect[] = [];
  private powerUps: PowerUp[] = [];
  private psyEffects: PsyEffect[] = [];
  private particles: Particle[] = [];
  private speed: number;
  private frames = 0;
  private lastSpawnFrame = 0;
  private lastPowerUpFrame = 0;
  private hue = 0;
  private entityIdCounter = 0;
  private bgIndex: number;
  private shake = 0;

  // Sprite index constants based on ASSET_PATHS.IMAGES order
  private static readonly SPRITE_FALLING_START = 12;  // BUG_1-4 (PNG with transparency) - was 0 for FALLING_1-4 (JPEG boxes)
  private static readonly SPRITE_FEVER_START = 12;    // BUG_1-4 (PNG with transparency) - was 8 for ANT_MASCOT_1-4
  private static readonly SPRITE_COUNT = 4;

  private requestRef: number | undefined;
  private isRunning = false;

  constructor(canvas: HTMLCanvasElement, images: HTMLImageElement[], config: GameEngineConfig, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.images = images;
    this.config = config;
    this.callbacks = callbacks;
    this.speed = config.initialSpeed;
    this.bgIndex = Math.floor(Math.random() * 4) + 4;
  }

  start(): void {
    this.stop();
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.requestRef !== undefined) {
      cancelAnimationFrame(this.requestRef);
      this.requestRef = undefined;
    }
  }

  reset(): void {
    this.insects = [];
    this.powerUps = [];
    this.psyEffects = [];
    this.particles = [];
    this.speed = this.config.initialSpeed;
    this.frames = 0;
    this.lastSpawnFrame = 0;
    this.lastPowerUpFrame = 0;
    this.hue = 0;
    this.entityIdCounter = 0;
    this.bgIndex = Math.floor(Math.random() * 4) + 4;
    this.shake = 0;
  }

  private loop(): void {
    if (!this.isRunning) return;

    const { getIsPlaying, getGameOver, getScore, getIsFeverMode } = this.callbacks;
    const isPlaying = getIsPlaying();
    const gameOver = getGameOver();

    if (gameOver || !isPlaying) {
      this.stop();
      return;
    }

    this.frames++;
    this.hue = (this.hue + (getIsFeverMode() ? 5 : 1)) % 360;

    const score = getScore();
    const isFeverMode = getIsFeverMode();

    if (shouldActivateFeverMode(score, this.config.feverThreshold, isFeverMode)) {
      this.callbacks.setFeverMode(true);
      this.callbacks.playFeverActivation();
    }

    this.shake = updateScreenShake(this.shake, isFeverMode, this.frames);

    this.speed = calculateGameSpeed({
      score,
      initialSpeed: this.config.initialSpeed,
      speedIncrement: this.config.speedIncrement,
      maxSpeed: this.config.maxSpeed,
    });

    const spawnInterval = calculateSpawnInterval({ isFeverMode, score });
    if (this.frames - this.lastSpawnFrame > spawnInterval) {
      this.spawnInsect();
      this.lastSpawnFrame = this.frames;
    }

    if (this.frames - this.lastPowerUpFrame > 540) {
      this.spawnPowerUp();
      this.lastPowerUpFrame = this.frames;
    }

    const speedMultiplier = this.callbacks.getIsSlowMo() ? 0.55 : 1;

    const moved = moveInsects(this.insects, this.canvas.height, isFeverMode, this.config.tileHeight, speedMultiplier);
    this.insects = moved.insects;

    if (moved.reachedBottom && !isFeverMode) {
      if (this.callbacks.consumeShield()) {
        this.insects = this.insects.filter((ins) => ins.y < this.canvas.height);
        this.shake = 18;
      } else {
        this.callbacks.recordMiss();
        this.callbacks.setGameOver(true);
        this.callbacks.addLeaderboardScore(score);
        this.callbacks.playErrorSound();
        this.callbacks.stopBgm();
      }
    }

    this.advancePowerUps(speedMultiplier);
    this.psyEffects = advancePsyEffects(this.psyEffects);
    this.advanceParticles();

    this.draw();

    this.requestRef = requestAnimationFrame(() => this.loop());
  }

  private spawnInsect(): void {
    const isFeverMode = this.callbacks.getIsFeverMode();
    const lane = Math.floor(Math.random() * this.config.laneCount);
    let spriteIndex: number;
    let cachedImage: HTMLImageElement | undefined;

    if (isFeverMode) {
      // Use BUG_1-4 (indices 12-15) for fever mode
      const feverOffset = Math.floor(Math.random() * GameEngine.SPRITE_COUNT);
      spriteIndex = GameEngine.SPRITE_FEVER_START + feverOffset;
      cachedImage = this.images[spriteIndex];
    } else {
      // Use FALLING_1-4 (indices 0-3) for normal mode
      const normalOffset = Math.floor(Math.random() * GameEngine.SPRITE_COUNT);
      spriteIndex = GameEngine.SPRITE_FALLING_START + normalOffset;
      cachedImage = this.images[spriteIndex];
    }

    this.insects.push({
      id: this.entityIdCounter++,
      lane,
      y: -this.config.tileHeight,
      spriteIndex,
      speed: this.speed * (isFeverMode ? 1.5 : 1),
      isFeverTarget: isFeverMode,
      cachedImage,
    });
  }

  private spawnPowerUp(): void {
    const lane = Math.floor(Math.random() * this.config.laneCount);
    const type: PowerUp['type'] = Math.random() > 0.5 ? 'shield' : 'slowmo';
    this.powerUps.push({ id: this.entityIdCounter++, lane, y: -this.config.tileHeight * 0.5, type });
  }

  private advancePowerUps(speedMultiplier: number): void {
    const fallSpeed = Math.max(2, this.speed * 0.7 * speedMultiplier);
    const next: PowerUp[] = [];
    for (const powerUp of this.powerUps) {
      const movedY = powerUp.y + fallSpeed;
      if (movedY <= this.canvas.height + this.config.tileHeight) {
        next.push({ ...powerUp, y: movedY });
      }
    }
    this.powerUps = next;
  }

  private advanceParticles(): void {
    const next: Particle[] = [];
    for (const particle of this.particles) {
      const life = particle.life + 1;
      if (life >= particle.maxLife) continue;
      next.push({ ...particle, life, x: particle.x + particle.vx, y: particle.y + particle.vy, vy: particle.vy + 0.08 });
    }
    this.particles = next;
  }

   private draw(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const isFeverMode = this.callbacks.getIsFeverMode();

    // Clear with dark background (no distracting images)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw strike zone indicators at bottom (subtle)
    const laneWidth = this.canvas.width / this.config.laneCount;
    if (!isFeverMode) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < this.config.laneCount; i++) {
        ctx.fillRect(i * laneWidth, this.canvas.height - this.config.tileHeight, laneWidth, this.config.tileHeight);
      }
    }

    // Draw psychedelic overlay in fever mode
    if (isFeverMode) {
      ctx.fillStyle = `hsla(${this.hue}, 80%, 20%, 0.3)`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw insects with lively wobble (not rotation)
    for (const insect of this.insects) {
      const img = insect.cachedImage;
      if (!img) continue;

      const size = this.config.tileHeight * (isFeverMode ? 1.2 : 0.8);
      const wobble = Math.sin(this.frames * 0.1 + insect.id) * 5; // Slight wobble

      ctx.save();
      // Position with slight horizontal wobble for "scurrying" effect
      const centerX = insect.lane * laneWidth + laneWidth / 2 + wobble;
      const centerY = insect.y + this.config.tileHeight / 2;
      ctx.translate(centerX, centerY);

      // Subtle scale pulse for "breathing" life
      const pulse = 1 + Math.sin(this.frames * 0.15 + insect.id) * 0.05;
      ctx.scale(pulse, pulse);

      if (isFeverMode) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 1)`;
      }

      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    for (const powerUp of this.powerUps) {
      const centerX = powerUp.lane * laneWidth + laneWidth / 2;
      const centerY = powerUp.y + this.config.tileHeight * 0.2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(this.frames * 0.04);
      ctx.font = '42px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerUp.type === 'shield' ? '🛡️' : '🐌', 0, 0);
      ctx.restore();
    }

    for (const p of this.psyEffects) {
      const progress = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 1 - progress;
      ctx.rotate(progress * Math.PI * 2);
      ctx.font = `${30 + progress * 50}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const symbols = ['🍄', '🌀', '🧠', '✨', '🐜'];
      ctx.fillText(symbols[Math.floor(p.hue % symbols.length)] ?? '✨', 0, 0);
      ctx.restore();
    }

    for (const particle of this.particles) {
      const alpha = 1 - particle.life / particle.maxLife;
      ctx.fillStyle = particle.color.replace('ALPHA', alpha.toFixed(2));
      ctx.fillRect(particle.x, particle.y, 3, 3);
    }

    ctx.restore();
  }

  handleTap(lane: number): void {
    if (!this.callbacks.getIsPlaying() || this.callbacks.getGameOver()) return;

    const tappedPowerUp = this.powerUps.find((powerUp) => powerUp.lane === lane);
    if (tappedPowerUp) {
      this.powerUps = this.powerUps.filter((powerUp) => powerUp.id !== tappedPowerUp.id);
      if (tappedPowerUp.type === 'shield') {
        this.callbacks.activateShield();
      } else {
        this.callbacks.activateSlowMo(5000);
      }
      this.createExplosion(lane, tappedPowerUp.y, 'rgba(130,255,255,ALPHA)');
      if (this.callbacks.getSoundEnabled()) {
        this.callbacks.playTapSound(true);
      }
      return;
    }

    const topInsect = findTopTargetInLane(this.insects, lane);
    if (!topInsect) {
      this.callbacks.recordMiss();
      return;
    }

    this.insects = this.insects.filter((ins) => ins.id !== topInsect.id);
    const comboMultiplier = this.callbacks.recordHit();
    const baseScore = this.callbacks.getIsFeverMode() ? 200 : 100;
    this.callbacks.addScore(baseScore * comboMultiplier);
    this.shake = this.callbacks.getIsFeverMode() ? 15 : 5;

    const hitX = topInsect.lane * (this.canvas.width / this.config.laneCount) + this.canvas.width / this.config.laneCount / 2;
    const hitY = topInsect.y + this.config.tileHeight / 2;
    this.createPsyEffect(hitX, hitY);
    this.createExplosion(lane, topInsect.y, this.callbacks.getIsFeverMode() ? 'rgba(255,70,200,ALPHA)' : 'rgba(255,220,80,ALPHA)');

    if (this.callbacks.getSoundEnabled()) {
      this.callbacks.playTapSound(this.callbacks.getIsFeverMode());
    }
  }

  private createPsyEffect(x: number, y: number): void {
    this.psyEffects.push({
      x,
      y,
      life: 0,
      maxLife: 30,
      hue: Math.random() * 360,
    });
  }

  private createExplosion(lane: number, y: number, color: string): void {
    const laneWidth = this.canvas.width / this.config.laneCount;
    const centerX = lane * laneWidth + laneWidth / 2;
    const centerY = y + this.config.tileHeight * 0.4;

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 24,
        color,
      });
    }
  }
}
