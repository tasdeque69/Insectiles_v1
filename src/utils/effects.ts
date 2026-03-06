import type { Insect, Particle, PsyEffect, ScorePopup } from './gameEngine';

const LANE_COLORS = [
  'rgba(255,100,150,ALPHA)',
  'rgba(100,200,255,ALPHA)',
  'rgba(150,255,150,ALPHA)',
  'rgba(255,220,100,ALPHA)',
];

const MAX_PARTICLES = 280;

export class EffectsSystem {
  private particles: Particle[] = [];
  private psyEffects: PsyEffect[] = [];
  private scorePopups: ScorePopup[] = [];
  private particlePool: Particle[] = [];

  constructor(
    private config: { laneCount: number; tileHeight: number },
    private getFeverMode: () => boolean
  ) {}

  tick(frames: number, insects: Insect[], canvasHeight: number, canvasWidth: number): void {
    this.advanceParticles();
    this.advanceInsectAnimations(insects);
    this.advanceScorePopups();
    this.createTrailParticles(frames, insects, canvasHeight, canvasWidth);
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

  private advanceInsectAnimations(insects: Insect[]): void {
    const next: Insect[] = [];
    for (const insect of insects) {
      if (insect.isHit) {
        insect.hitAlpha = (insect.hitAlpha || 1) - 0.08;
        insect.hitScale = (insect.hitScale || 1) + 0.02;
        if (insect.hitAlpha <= 0) continue;
      }

      if (!insect.isHit) {
        insect.frameAdvanceCounter++;
        if (insect.frameAdvanceCounter >= insect.frameAdvanceRate) {
          insect.frameAdvanceCounter = 0;
          insect.frameIndex = (insect.frameIndex + 1) % insect.frameCount;
        }
      }

      next.push(insect);
    }
    insects.splice(0, insects.length, ...next);
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

  private createTrailParticles(frames: number, insects: Insect[], canvasHeight: number, canvasWidth: number): void {
    if (frames % 6 !== 0) return;
    const laneWidth = canvasWidth / this.config.laneCount;

    for (const insect of insects) {
      const centerX = insect.lane * laneWidth + laneWidth / 2;
      const laneColor = LANE_COLORS[insect.lane % LANE_COLORS.length];

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
  }

  private emitParticle(particle: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) return;
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

  createExplosion(lane: number, y: number, color: string, canvasWidth: number): void {
    const laneWidth = canvasWidth / this.config.laneCount;
    const centerX = lane * laneWidth + laneWidth / 2;
    const centerY = y + this.config.tileHeight * 0.4;
    const laneColor = LANE_COLORS[lane % LANE_COLORS.length];

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

  createPsyEffect(x: number, y: number): void {
    this.psyEffects.push({
      x,
      y,
      life: 0,
      maxLife: 30,
      hue: Math.random() * 360,
    });
  }

  createScorePopup(x: number, y: number, points: number, combo: number): void {
    let color = '#fff';
    let text = `+${points}`;

    if (combo >= 3) {
      color = '#ffd700';
      text = `${points} x${combo}`;
    }
    if (this.getFeverMode()) {
      color = '#ff46c8';
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

  advancePsyEffects(): PsyEffect[] {
    const next: PsyEffect[] = [];
    for (const effect of this.psyEffects) {
      const updated = { ...effect, life: effect.life + 1 };
      if (updated.life < updated.maxLife) next.push(updated);
    }
    this.psyEffects = next;
    return next;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getPsyEffects(): PsyEffect[] {
    return this.psyEffects;
  }

  getScorePopups(): ScorePopup[] {
    return this.scorePopups;
  }

  setParticles(particles: Particle[]): void {
    this.particles = particles;
  }

  setPsyEffects(effects: PsyEffect[]): void {
    this.psyEffects = effects;
  }

  setScorePopups(popups: ScorePopup[]): void {
    this.scorePopups = popups;
  }

  reset(): void {
    this.particles = [];
    this.psyEffects = [];
    this.scorePopups = [];
    this.particlePool = [];
  }
}
