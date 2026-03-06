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
  // Animation state (AAA-002)
  frameIndex: number;
  frameCount: number;
  frameAdvanceCounter: number;
  frameAdvanceRate: number;
  useSpriteSheet: boolean;
  spriteRow: number;
  // Hit animation state (AAA-004)
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

  private insects: Insect[] = [];
  private powerUps: PowerUp[] = [];
  private psyEffects: PsyEffect[] = [];
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];
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

  // Animation configuration (AAA-002)
  private static readonly WALK_FRAME_COUNT = 8;
  private static readonly WALK_FRAME_RATE = 5;
  private static readonly WALK_SPRITE_ROWS = 4;
  private static readonly WALK_SPRITE_PATH = 'ant-walk-cycle.svg';

  // Lane-specific colors for particles (AAA-005)
  private static readonly LANE_COLORS = [
    'rgba(255,100,150,ALPHA)',  // Lane 0: Pink
    'rgba(100,200,255,ALPHA)',  // Lane 1: Blue
    'rgba(150,255,150,ALPHA)',  // Lane 2: Green
    'rgba(255,220,100,ALPHA)',  // Lane 3: Gold
  ];

  private static readonly MAX_PARTICLES = 280;
  private particlePool: Particle[] = [];

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
    this.particlePool = [];
    this.scorePopups = [];
    this.speed = this.config.initialSpeed;
    this.frames = 0;
    this.lastSpawnFrame = 0;
    this.lastPowerUpFrame = 0;
    this.hue = 0;
    this.entityIdCounter = 0;
    this.bgIndex = Math.floor(Math.random() * 4) + 4;
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
    this.advanceInsectAnimations();
    this.advanceScorePopups();

    this.draw();

    this.requestRef = requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
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
      // Use generated 8x4 sprite sheet for walk cycle in normal mode
      cachedImage = this.images.find((img) => img.src.includes(GameEngine.WALK_SPRITE_PATH));
      const fallbackOffset = Math.floor(Math.random() * GameEngine.SPRITE_COUNT);
      spriteIndex = cachedImage ? -1 : GameEngine.SPRITE_FALLING_START + fallbackOffset;
      if (!cachedImage) cachedImage = this.images[spriteIndex];
    }

    this.insects.push({
      id: this.entityIdCounter++,
      lane,
      y: -this.config.tileHeight,
      spriteIndex,
      speed: this.speed * (isFeverMode ? 1.5 : 1),
      isFeverTarget: isFeverMode,
      cachedImage,
      frameIndex: 0,
      frameCount: GameEngine.WALK_FRAME_COUNT,
      frameAdvanceCounter: 0,
      frameAdvanceRate: GameEngine.WALK_FRAME_RATE,
      useSpriteSheet: !isFeverMode,
      spriteRow: lane % GameEngine.WALK_SPRITE_ROWS,
      hitScale: 1,
      hitAlpha: 1,
      isHit: false,
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
      if (life >= particle.maxLife) {
        this.particlePool.push(particle);
        continue;
      }
      particle.life = life;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.08;
      next.push(particle);
    }
    this.particles = next;
  }

  private advanceInsectAnimations(): void {
    const next: Insect[] = [];
    for (const insect of this.insects) {
      // Handle hit animation (AAA-004: squash & stretch)
      if (insect.isHit) {
        insect.hitAlpha = (insect.hitAlpha || 1) - 0.08;
        insect.hitScale = (insect.hitScale || 1) + 0.02;
        if (insect.hitAlpha <= 0) continue; // Remove after fade out
      }

      // Handle walk cycle animation (AAA-002)
      if (!insect.isHit) {
        insect.frameAdvanceCounter++;
        if (insect.frameAdvanceCounter >= insect.frameAdvanceRate) {
          insect.frameAdvanceCounter = 0;
          insect.frameIndex = (insect.frameIndex + 1) % insect.frameCount;
        }
        // AAA-005: Spawn trail particles for falling insects
        if (this.frames % 6 === 0) {
          this.createTrailParticle(insect);
        }
      }

      next.push(insect);
    }
    this.insects = next;
  }

  private advanceScorePopups(): void {
    const next: ScorePopup[] = [];
    for (const popup of this.scorePopups) {
      popup.y -= 1.5;
      popup.scale = 1.3 - (popup.life / popup.maxLife) * 0.4;
      popup.life++;
      if (popup.life < popup.maxLife) {
        next.push(popup);
      }
    }
    this.scorePopups = next;
  }

   private draw(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const isFeverMode = this.callbacks.getIsFeverMode();
    const reducedMotion = this.callbacks.getReducedMotion();

    // Clear with dark background (no distracting images)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw strike zone indicators at bottom (AAA-006)
    const laneWidth = this.canvas.width / this.config.laneCount;
    const strikeZoneY = this.canvas.height - this.config.tileHeight;

    if (!isFeverMode) {
      // Base strike zone with pulsing glow
      const pulseAlpha = 0.05 + Math.sin(this.frames * 0.08) * 0.02;
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
      for (let i = 0; i < this.config.laneCount; i++) {
        ctx.fillRect(i * laneWidth, strikeZoneY, laneWidth, this.config.tileHeight);
      }

      // Highlight lanes with insects in strike zone
      for (const insect of this.insects) {
        if (insect.y > strikeZoneY - this.config.tileHeight && !insect.isHit) {
          const laneColor = GameEngine.LANE_COLORS[insect.lane % GameEngine.LANE_COLORS.length].replace('ALPHA', '0.15');
          ctx.fillStyle = laneColor;
          ctx.fillRect(insect.lane * laneWidth, strikeZoneY, laneWidth, this.config.tileHeight);
        }
      }

      // Draw strike line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, strikeZoneY);
      ctx.lineTo(this.canvas.width, strikeZoneY);
      ctx.stroke();
    }

    // Draw psychedelic overlay in fever mode
    if (isFeverMode) {
      const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      gradient.addColorStop(0, `hsla(${this.hue}, 90%, 55%, ${reducedMotion ? 0.15 : 0.28})`);
      gradient.addColorStop(0.5, `hsla(${(this.hue + 60) % 360}, 90%, 50%, ${reducedMotion ? 0.1 : 0.24})`);
      gradient.addColorStop(1, `hsla(${(this.hue + 140) % 360}, 95%, 45%, ${reducedMotion ? 0.14 : 0.3})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      if (!reducedMotion) {
        const feverPulse = 0.35 + Math.sin(this.frames * 0.14) * 0.15;
        ctx.strokeStyle = `hsla(${(this.hue + 200) % 360}, 100%, 70%, ${feverPulse})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, this.canvas.width - 6, this.canvas.height - 6);
      }
    }

    // Draw insects with lively wobble (not rotation)
    for (const insect of this.insects) {
      const img = insect.cachedImage;
      if (!img) continue;

      const size = this.config.tileHeight * (isFeverMode ? 1.2 : 0.8);
      const wobble = reducedMotion ? 0 : Math.sin(this.frames * 0.1 + insect.id) * 5; // Slight wobble

      // AAA-003: Draw shadow under insect for depth
      const shadowY = insect.y + this.config.tileHeight + 10;
      const shadowScale = Math.max(0.3, 1 - (insect.y / this.canvas.height) * 0.5);
      ctx.save();
      ctx.translate(insect.lane * laneWidth + laneWidth / 2, shadowY);
      ctx.scale(shadowScale, shadowScale * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      // Position with slight horizontal wobble for "scurrying" effect
      const centerX = insect.lane * laneWidth + laneWidth / 2 + wobble;
      const centerY = insect.y + this.config.tileHeight / 2;
      ctx.translate(centerX, centerY);

      // Subtle scale pulse for "breathing" life
      const pulse = reducedMotion ? 1 : 1 + Math.sin(this.frames * 0.15 + insect.id) * 0.05;
      ctx.scale(pulse, pulse);

      // AAA-004: Apply hit animation (squash & stretch)
      if (insect.isHit && insect.hitScale !== undefined) {
        ctx.scale(insect.hitScale, insect.hitScale);
        ctx.globalAlpha = Math.max(0, insect.hitAlpha || 1);
      }

      if (isFeverMode) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 1)`;
      }

      if (insect.useSpriteSheet && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const frameWidth = img.naturalWidth / GameEngine.WALK_FRAME_COUNT;
        const frameHeight = img.naturalHeight / GameEngine.WALK_SPRITE_ROWS;
        const sx = Math.floor(insect.frameIndex % GameEngine.WALK_FRAME_COUNT) * frameWidth;
        const sy = Math.floor(insect.spriteRow % GameEngine.WALK_SPRITE_ROWS) * frameHeight;
        ctx.drawImage(img, sx, sy, frameWidth, frameHeight, -size / 2, -size / 2, size, size);
      } else {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    }

    for (const powerUp of this.powerUps) {
      const centerX = powerUp.lane * laneWidth + laneWidth / 2;
      const centerY = powerUp.y + this.config.tileHeight * 0.2;
      ctx.save();
      ctx.translate(centerX, centerY);
      if (!reducedMotion) ctx.rotate(this.frames * 0.04);
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

    // AAA-007: Render floating score popups
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const popup of this.scorePopups) {
      const alpha = 1 - popup.life / popup.maxLife;
      ctx.save();
      ctx.translate(popup.x, popup.y);
      const popupScale = reducedMotion ? 1 : popup.scale;
      ctx.scale(popupScale, popupScale);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = popup.color;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(popup.text, 0, 0);
      ctx.restore();
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
        this.callbacks.playTapSound(lane, true);
        this.callbacks.triggerHaptic([8, 20, 8]);
      }
      return;
    }

    const topInsect = findTopTargetInLane(this.insects, lane);
    if (!topInsect) {
      this.callbacks.recordMiss();
      this.callbacks.triggerHaptic(12);
      return;
    }

    // AAA-004: Trigger hit animation instead of instant removal
    const hitInsect = this.insects.find((ins) => ins.id === topInsect.id);
    if (hitInsect) {
      hitInsect.isHit = true;
      hitInsect.hitScale = 1.3;
      hitInsect.hitAlpha = 1;
    }

    const comboMultiplier = this.callbacks.recordHit();
    const baseScore = this.callbacks.getIsFeverMode() ? 200 : 100;
    const totalScore = baseScore * comboMultiplier;
    this.callbacks.addScore(totalScore);
    this.shake = this.callbacks.getIsFeverMode() ? 15 : 5;

    const hitX = topInsect.lane * (this.canvas.width / this.config.laneCount) + this.canvas.width / this.config.laneCount / 2;
    const hitY = topInsect.y + this.config.tileHeight / 2;
    this.createPsyEffect(hitX, hitY);
    this.createExplosion(lane, topInsect.y, this.callbacks.getIsFeverMode() ? 'rgba(255,70,200,ALPHA)' : 'rgba(255,220,80,ALPHA)');
    this.createScorePopup(hitX, hitY, totalScore, comboMultiplier);

    if (this.callbacks.getSoundEnabled()) {
      this.callbacks.playTapSound(lane, this.callbacks.getIsFeverMode());
      this.callbacks.triggerHaptic(this.callbacks.getIsFeverMode() ? [12, 25, 12] : 18);
    }
  }


  private emitParticle(particle: Particle): void {
    if (this.particles.length >= GameEngine.MAX_PARTICLES) return;
    const reused = this.particlePool.pop();
    if (reused) {
      reused.x = particle.x;
      reused.y = particle.y;
      reused.vx = particle.vx;
      reused.vy = particle.vy;
      reused.life = particle.life;
      reused.maxLife = particle.maxLife;
      reused.color = particle.color;
      this.particles.push(reused);
      return;
    }
    this.particles.push(particle);
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
    const laneColor = GameEngine.LANE_COLORS[lane % GameEngine.LANE_COLORS.length];

    // AAA-005: Enhanced explosion with more particles and lane colors
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      const useLaneColor = Math.random() > 0.3;
      this.emitParticle({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        color: useLaneColor ? laneColor : color,
      });
    }
  }

  // AAA-005: Create trail particles behind falling insects
  private createTrailParticle(insect: Insect): void {
    const laneWidth = this.canvas.width / this.config.laneCount;
    const centerX = insect.lane * laneWidth + laneWidth / 2;
    const laneColor = GameEngine.LANE_COLORS[insect.lane % GameEngine.LANE_COLORS.length];

    this.emitParticle({
      x: centerX + (Math.random() - 0.5) * 20,
      y: insect.y + this.config.tileHeight * 0.8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.3 + Math.random() * 0.5,
      life: 0,
      maxLife: 12,
      color: laneColor,
    });
  }

  // AAA-007: Create floating score popup
  private createScorePopup(x: number, y: number, points: number, combo: number): void {
    let color = '#fff';
    let text = `+${points}`;

    if (combo >= 3) {
      color = '#ffd700'; // Gold for combo
      text = `${points} x${combo}`;
    }
    if (this.callbacks.getIsFeverMode()) {
      color = '#ff46c8'; // Fever pink
      text = `${points} FEVER!`;
    }

    this.scorePopups.push({
      x,
      y,
      text,
      life: 0,
      maxLife: 40,
      scale: 1.3,
      color,
    });
  }
}
