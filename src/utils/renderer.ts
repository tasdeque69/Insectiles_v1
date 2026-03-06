import type { Insect, PowerUp, PsyEffect, Particle, ScorePopup } from './gameEngine';

const LANE_COLORS = [
  'rgba(255,100,150,ALPHA)',
  'rgba(100,200,255,ALPHA)',
  'rgba(150,255,150,ALPHA)',
  'rgba(255,220,100,ALPHA)',
];

const WALK_FRAME_COUNT = 8;
const WALK_SPRITE_ROWS = 4;

const SYMBOLS = ['🍄', '🌀', '🧠', '✨', '🐜'];

export class Renderer {
  private hue = 0;

  constructor(
    private config: { laneCount: number; tileHeight: number },
    private getFeverMode: () => boolean,
    private getReducedMotion: () => boolean
  ) {}

  render(
    ctx: CanvasRenderingContext2D,
    canvas: { width: number; height: number },
    state: {
      insects: Insect[];
      powerUps: PowerUp[];
      psyEffects: PsyEffect[];
      particles: Particle[];
      scorePopups: ScorePopup[];
      shake: number;
    },
    frames: number
  ): void {
    const isFeverMode = this.getFeverMode();
    const reducedMotion = this.getReducedMotion();

    ctx.save();
    if (state.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * state.shake,
        (Math.random() - 0.5) * state.shake
      );
    }

    this.drawBackground(ctx, canvas, isFeverMode, reducedMotion, frames);
    this.drawStrikeZone(ctx, canvas, state.insects, isFeverMode, reducedMotion, frames);
    this.drawInsects(ctx, canvas, state.insects, isFeverMode, reducedMotion, frames);
    this.drawPowerUps(ctx, canvas, state.powerUps, reducedMotion, frames);
    this.drawPsyEffects(ctx, state.psyEffects);
    this.drawParticles(ctx, state.particles);
    this.drawScorePopups(ctx, state.scorePopups, reducedMotion);

    ctx.restore();
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    canvas: { width: number; height: number },
    isFeverMode: boolean,
    reducedMotion: boolean,
    frames: number
  ): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isFeverMode) {
      this.hue = (this.hue + 3) % 360;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `hsla(${this.hue}, 90%, 55%, ${reducedMotion ? 0.15 : 0.28})`);
      gradient.addColorStop(0.5, `hsla(${(this.hue + 60) % 360}, 90%, 50%, ${reducedMotion ? 0.1 : 0.24})`);
      gradient.addColorStop(1, `hsla(${(this.hue + 140) % 360}, 95%, 45%, ${reducedMotion ? 0.14 : 0.3})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!reducedMotion) {
        const feverPulse = 0.35 + Math.sin(frames * 0.14) * 0.15;
        ctx.strokeStyle = `hsla(${(this.hue + 200) % 360}, 100%, 70%, ${feverPulse})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
      }
    }
  }

  private drawStrikeZone(
    ctx: CanvasRenderingContext2D,
    canvas: { width: number; height: number },
    insects: Insect[],
    isFeverMode: boolean,
    reducedMotion: boolean,
    frames: number
  ): void {
    if (isFeverMode) return;

    const laneWidth = canvas.width / this.config.laneCount;
    const strikeZoneY = canvas.height - this.config.tileHeight;

    const pulseAlpha = 0.05 + Math.sin(frames * 0.08) * 0.02;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
    for (let i = 0; i < this.config.laneCount; i++) {
      ctx.fillRect(i * laneWidth, strikeZoneY, laneWidth, this.config.tileHeight);
    }

    for (const insect of insects) {
      if (insect.y > strikeZoneY - this.config.tileHeight && !insect.isHit) {
        const laneColor = LANE_COLORS[insect.lane % LANE_COLORS.length].replace('ALPHA', '0.15');
        ctx.fillStyle = laneColor;
        ctx.fillRect(insect.lane * laneWidth, strikeZoneY, laneWidth, this.config.tileHeight);
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, strikeZoneY);
    ctx.lineTo(canvas.width, strikeZoneY);
    ctx.stroke();
  }

  private drawInsects(
    ctx: CanvasRenderingContext2D,
    canvas: { width: number; height: number },
    insects: Insect[],
    isFeverMode: boolean,
    reducedMotion: boolean,
    frames: number
  ): void {
    const laneWidth = canvas.width / this.config.laneCount;

    for (const insect of insects) {
      const img = insect.cachedImage;
      if (!img) continue;

      const size = this.config.tileHeight * (isFeverMode ? 1.2 : 0.8);
      const wobble = reducedMotion ? 0 : Math.sin(frames * 0.1 + insect.id) * 5;

      const shadowY = insect.y + this.config.tileHeight + 10;
      const shadowScale = Math.max(0.3, 1 - (insect.y / canvas.height) * 0.5);
      ctx.save();
      ctx.translate(insect.lane * laneWidth + laneWidth / 2, shadowY);
      ctx.scale(shadowScale, shadowScale * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      const centerX = insect.lane * laneWidth + laneWidth / 2 + wobble;
      const centerY = insect.y + this.config.tileHeight / 2;
      ctx.translate(centerX, centerY);

      const pulse = reducedMotion ? 1 : 1 + Math.sin(frames * 0.15 + insect.id) * 0.05;
      ctx.scale(pulse, pulse);

      if (insect.isHit && insect.hitScale !== undefined) {
        ctx.scale(insect.hitScale, insect.hitScale);
        ctx.globalAlpha = Math.max(0, insect.hitAlpha || 1);
      }

      if (isFeverMode) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 1)`;
      }

      if (insect.useSpriteSheet && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const frameWidth = img.naturalWidth / WALK_FRAME_COUNT;
        const frameHeight = img.naturalHeight / WALK_SPRITE_ROWS;
        const sx = Math.floor(insect.frameIndex % WALK_FRAME_COUNT) * frameWidth;
        const sy = Math.floor(insect.spriteRow % WALK_SPRITE_ROWS) * frameHeight;
        ctx.drawImage(img, sx, sy, frameWidth, frameHeight, -size / 2, -size / 2, size, size);
      } else {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    }
  }

  private drawPowerUps(
    ctx: CanvasRenderingContext2D,
    canvas: { width: number; height: number },
    powerUps: PowerUp[],
    reducedMotion: boolean,
    frames: number
  ): void {
    const laneWidth = canvas.width / this.config.laneCount;

    for (const powerUp of powerUps) {
      const centerX = powerUp.lane * laneWidth + laneWidth / 2;
      const centerY = powerUp.y + this.config.tileHeight * 0.2;
      ctx.save();
      ctx.translate(centerX, centerY);
      if (!reducedMotion) ctx.rotate(frames * 0.04);
      ctx.font = '42px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerUp.type === 'shield' ? '🛡️' : '🐌', 0, 0);
      ctx.restore();
    }
  }

  private drawPsyEffects(ctx: CanvasRenderingContext2D, psyEffects: PsyEffect[]): void {
    for (const p of psyEffects) {
      const progress = p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 1 - progress;
      ctx.rotate(progress * Math.PI * 2);
      ctx.font = `${30 + progress * 50}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SYMBOLS[Math.floor(p.hue % SYMBOLS.length)] ?? '✨', 0, 0);
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    for (const particle of particles) {
      const alpha = 1 - particle.life / particle.maxLife;
      ctx.fillStyle = particle.color.replace('ALPHA', alpha.toFixed(2));
      ctx.fillRect(particle.x, particle.y, 3, 3);
    }
  }

  private drawScorePopups(ctx: CanvasRenderingContext2D, scorePopups: ScorePopup[], reducedMotion: boolean): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const popup of scorePopups) {
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
  }

  getHue(): number {
    return this.hue;
  }

  reset(): void {
    this.hue = 0;
  }
}
