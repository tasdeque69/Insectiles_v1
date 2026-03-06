import type { PowerUp } from './gameEngine';

export class PowerUpSystem {
  private powerUps: PowerUp[] = [];

  constructor(
    private config: { laneCount: number; tileHeight: number },
    private getSpeed: () => number
  ) {}

  tick(speedMultiplier: number): void {
    const fallSpeed = Math.max(2, this.getSpeed() * 0.7 * speedMultiplier);
    const next: PowerUp[] = [];
    const canvasHeight = 800;

    for (const powerUp of this.powerUps) {
      const movedY = powerUp.y + fallSpeed;
      if (movedY <= canvasHeight + this.config.tileHeight) {
        next.push({ ...powerUp, y: movedY });
      }
    }
    this.powerUps = next;
  }

  getPowerUps(): PowerUp[] {
    return this.powerUps;
  }

  setPowerUps(powerUps: PowerUp[]): void {
    this.powerUps = powerUps;
  }

  findByLane(lane: number): PowerUp | undefined {
    return this.powerUps.find((p) => p.lane === lane);
  }

  remove(id: number): void {
    this.powerUps = this.powerUps.filter((p) => p.id !== id);
  }

  reset(): void {
    this.powerUps = [];
  }
}
