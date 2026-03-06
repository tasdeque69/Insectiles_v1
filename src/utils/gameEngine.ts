import { calculateGameSpeed, shouldActivateFeverMode } from '../utils/gameRules';
import { advancePsyEffects, moveInsects, updateScreenShake } from '../utils/loop';
import { findTopTargetInLane } from '../utils/gameplay';
import { Spawner } from './spawner';
import { EffectsSystem } from './effects';
import { PowerUpSystem } from './powerUpSystem';
import { Renderer } from './renderer';

export interface Insect {
  id: number;
  lane: number;
  y: number;
  spriteIndex: number;
  speed: number;
  isFeverTarget?: boolean;
  cachedImage?: HTMLImageElement;
  frameIndex: number;
  frameCount: number;
  frameAdvanceCounter: number;
  frameAdvanceRate: number;
  useSpriteSheet: boolean;
  spriteRow: number;
  hitScale?: number;
  hitAlpha?: number;
  isHit?: boolean;
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

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  scale: number;
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
  playTapSound: (lane: number, isFever: boolean) => void;
  playErrorSound: () => void;
  triggerHaptic: (pattern?: number | number[]) => void;
  getReducedMotion: () => boolean;
  stopBgm: () => void;
  onFrame?: (timestamp: number) => void;
}

export class GameEngine {
  private config: GameEngineConfig;
  private callbacks: EngineCallbacks;
  private canvas: HTMLCanvasElement;
  private images: HTMLImageElement[];

  private spawner: Spawner;
  private effects: EffectsSystem;
  private powerUpSystem: PowerUpSystem;
  private renderer: Renderer;

  private speed: number;
  private frames = 0;
  private shake = 0;

  private requestRef: number | undefined;
  private isRunning = false;

  constructor(canvas: HTMLCanvasElement, images: HTMLImageElement[], config: GameEngineConfig, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.images = images;
    this.config = config;
    this.callbacks = callbacks;
    this.speed = config.initialSpeed;

    this.spawner = new Spawner(
      { laneCount: config.laneCount, tileHeight: config.tileHeight },
      {
        sprites: images,
        walkSpritePath: 'ant-walk-cycle.svg',
        spriteFallingStart: 12,
        spriteFeverStart: 12,
        spriteCount: 4,
      },
      () => callbacks.getIsFeverMode(),
      () => this.speed
    );

    this.effects = new EffectsSystem(
      { laneCount: config.laneCount, tileHeight: config.tileHeight },
      () => callbacks.getIsFeverMode()
    );

    this.powerUpSystem = new PowerUpSystem(
      { laneCount: config.laneCount, tileHeight: config.tileHeight },
      () => this.speed
    );

    this.renderer = new Renderer(
      { laneCount: config.laneCount, tileHeight: config.tileHeight },
      () => callbacks.getIsFeverMode(),
      () => callbacks.getReducedMotion()
    );
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
    this.spawner.reset();
    this.effects.reset();
    this.powerUpSystem.reset();
    this.renderer.reset();
    this.speed = this.config.initialSpeed;
    this.frames = 0;
    this.shake = 0;
  }

  private loop(timestamp: number = performance.now()): void {
    if (!this.isRunning) return;

    const { getIsPlaying, getGameOver, getScore, getIsFeverMode } = this.callbacks;
    const isPlaying = getIsPlaying();
    const gameOver = getGameOver();

    if (gameOver || !isPlaying) {
      this.stop();
      return;
    }

    this.callbacks.onFrame?.(timestamp);

    this.frames++;
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

    this.spawner.tick(this.frames);

    const speedMultiplier = this.callbacks.getIsSlowMo() ? 0.55 : 1;

    const insects = this.spawner.getInsects();
    const moved = moveInsects(insects, this.canvas.height, isFeverMode, this.config.tileHeight, speedMultiplier);
    this.spawner.setInsects(moved.insects);

    if (moved.reachedBottom && !isFeverMode) {
      if (this.callbacks.consumeShield()) {
        const remaining = this.spawner.getInsects().filter((ins) => ins.y < this.canvas.height);
        this.spawner.setInsects(remaining);
        this.shake = 18;
      } else {
        this.callbacks.recordMiss();
        this.callbacks.setGameOver(true);
        this.callbacks.addLeaderboardScore(score);
        this.callbacks.playErrorSound();
        this.callbacks.stopBgm();
      }
    }

    this.powerUpSystem.tick(speedMultiplier);
    this.spawner.setPowerUps(this.powerUpSystem.getPowerUps());

    const currentInsects = this.spawner.getInsects();
    this.effects.tick(this.frames, currentInsects, this.canvas.height, this.canvas.width);
    this.spawner.setInsects(currentInsects);

    const psyEffects = this.effects.advancePsyEffects();
    this.effects.setPsyEffects(psyEffects);

    this.draw();

    this.requestRef = requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
  }

  private draw(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    this.renderer.render(
      ctx,
      { width: this.canvas.width, height: this.canvas.height },
      {
        insects: this.spawner.getInsects(),
        powerUps: this.powerUpSystem.getPowerUps(),
        psyEffects: this.effects.getPsyEffects(),
        particles: this.effects.getParticles(),
        scorePopups: this.effects.getScorePopups(),
        shake: this.shake,
      },
      this.frames
    );
  }

  handleTap(lane: number): void {
    if (!this.callbacks.getIsPlaying() || this.callbacks.getGameOver()) return;

    const tappedPowerUp = this.powerUpSystem.getPowerUps().find((p) => p.lane === lane);
    if (tappedPowerUp) {
      this.powerUpSystem.remove(tappedPowerUp.id);
      if (tappedPowerUp.type === 'shield') {
        this.callbacks.activateShield();
      } else {
        this.callbacks.activateSlowMo(5000);
      }
      this.effects.createExplosion(lane, tappedPowerUp.y, 'rgba(130,255,255,ALPHA)', this.canvas.width);
      if (this.callbacks.getSoundEnabled()) {
        this.callbacks.playTapSound(lane, true);
        this.callbacks.triggerHaptic([8, 20, 8]);
      }
      return;
    }

    const insects = this.spawner.getInsects();
    const topInsect = findTopTargetInLane(insects, lane);
    if (!topInsect) {
      this.callbacks.recordMiss();
      this.callbacks.triggerHaptic(12);
      return;
    }

    const hitInsect = insects.find((ins) => ins.id === topInsect.id);
    if (hitInsect) {
      hitInsect.isHit = true;
      hitInsect.hitScale = 1.3;
      hitInsect.hitAlpha = 1;
    }
    this.spawner.setInsects(insects);

    const comboMultiplier = this.callbacks.recordHit();
    const baseScore = this.callbacks.getIsFeverMode() ? 200 : 100;
    const totalScore = baseScore * comboMultiplier;
    this.callbacks.addScore(totalScore);
    this.shake = this.callbacks.getIsFeverMode() ? 15 : 5;

    const hitX = topInsect.lane * (this.canvas.width / this.config.laneCount) + this.canvas.width / this.config.laneCount / 2;
    const hitY = topInsect.y + this.config.tileHeight / 2;
    this.effects.createPsyEffect(hitX, hitY);
    this.effects.createExplosion(lane, topInsect.y, this.callbacks.getIsFeverMode() ? 'rgba(255,70,200,ALPHA)' : 'rgba(255,220,80,ALPHA)', this.canvas.width);
    this.effects.createScorePopup(hitX, hitY, totalScore, comboMultiplier);

    if (this.callbacks.getSoundEnabled()) {
      this.callbacks.playTapSound(lane, this.callbacks.getIsFeverMode());
      this.callbacks.triggerHaptic(this.callbacks.getIsFeverMode() ? [12, 25, 12] : 18);
    }
  }

  get insects(): Insect[] {
    return this.spawner.getInsects();
  }

  set insects(value: Insect[]) {
    this.spawner.setInsects(value);
  }

  get powerUps(): PowerUp[] {
    return this.powerUpSystem.getPowerUps();
  }

  set powerUps(value: PowerUp[]) {
    this.powerUpSystem.setPowerUps(value);
  }

  get psyEffects(): PsyEffect[] {
    return this.effects.getPsyEffects();
  }

  set psyEffects(value: PsyEffect[]) {
    this.effects.setPsyEffects(value);
  }

  get particles(): Particle[] {
    return this.effects.getParticles();
  }

  set particles(value: Particle[]) {
    this.effects.setParticles(value);
  }

  get hue(): number {
    return this.renderer.getHue();
  }

  set hue(value: number) {
    // No-op: hue is managed by renderer internally
  }

  get scorePopups(): ScorePopup[] {
    return this.effects.getScorePopups();
  }

  get entityIdCounter(): number {
    return 0;
  }

  set entityIdCounter(value: number) {
    // No-op: entity IDs are managed by spawner internally
  }
}
