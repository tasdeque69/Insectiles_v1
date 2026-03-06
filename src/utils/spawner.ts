import type { Insect, PowerUp } from './gameEngine';

export interface SpawnerConfig {
  laneCount: number;
  tileHeight: number;
}

export interface SpawnerImages {
  sprites: HTMLImageElement[];
  walkSpritePath: string;
  spriteFallingStart: number;
  spriteFeverStart: number;
  spriteCount: number;
}

const WALK_SPRITE_PATH = 'ant-walk-cycle.svg';
const WALK_FRAME_COUNT = 8;
const WALK_FRAME_RATE = 5;
const WALK_SPRITE_ROWS = 4;

export class Spawner {
  private insects: Insect[] = [];
  private powerUps: PowerUp[] = [];
  private entityIdCounter = 0;
  private lastSpawnFrame = 0;
  private lastPowerUpFrame = 0;

  constructor(
    private config: SpawnerConfig,
    private images: SpawnerImages,
    private getFeverMode: () => boolean,
    private getSpeed: () => number
  ) {}

  tick(frames: number): void {
    if (this.shouldSpawnInsect(frames)) {
      this.spawnInsect();
      this.lastSpawnFrame = frames;
    }
    if (frames - this.lastPowerUpFrame > 540) {
      this.spawnPowerUp();
      this.lastPowerUpFrame = frames;
    }
  }

  private shouldSpawnInsect(frames: number): boolean {
    const isFeverMode = this.getFeverMode();
    const baseInterval = isFeverMode ? 30 : 100;
    const spawnInterval = Math.max(20, baseInterval);
    return frames - this.lastSpawnFrame > spawnInterval;
  }

  private spawnInsect(): void {
    const isFeverMode = this.getFeverMode();
    const speed = this.getSpeed();
    const lane = Math.floor(Math.random() * this.config.laneCount);
    let spriteIndex: number;
    let cachedImage: HTMLImageElement | undefined;

    if (isFeverMode) {
      const feverOffset = Math.floor(Math.random() * this.images.spriteCount);
      spriteIndex = this.images.spriteFeverStart + feverOffset;
      cachedImage = this.images.sprites[spriteIndex];
    } else {
      cachedImage = this.images.sprites.find((img) => img.src.includes(WALK_SPRITE_PATH));
      if (!cachedImage) {
        const fallbackOffset = Math.floor(Math.random() * this.images.spriteCount);
        spriteIndex = this.images.spriteFallingStart + fallbackOffset;
        cachedImage = this.images.sprites[spriteIndex];
      } else {
        spriteIndex = -1;
      }
    }

    if (!cachedImage) {
      cachedImage = new Image();
    }

    this.insects.push({
      id: this.entityIdCounter++,
      lane,
      y: -this.config.tileHeight,
      spriteIndex,
      speed: speed * (isFeverMode ? 1.5 : 1),
      isFeverTarget: isFeverMode,
      cachedImage,
      frameIndex: 0,
      frameCount: WALK_FRAME_COUNT,
      frameAdvanceCounter: 0,
      frameAdvanceRate: WALK_FRAME_RATE,
      useSpriteSheet: !isFeverMode,
      spriteRow: lane % WALK_SPRITE_ROWS,
      hitScale: 1,
      hitAlpha: 1,
      isHit: false,
    });
  }

  private spawnPowerUp(): void {
    const lane = Math.floor(Math.random() * this.config.laneCount);
    const type: 'shield' | 'slowmo' = Math.random() > 0.5 ? 'shield' : 'slowmo';
    this.powerUps.push({
      id: this.entityIdCounter++,
      lane,
      y: -this.config.tileHeight * 0.5,
      type,
    });
  }

  getInsects(): Insect[] {
    return this.insects;
  }

  setInsects(insects: Insect[]): void {
    this.insects = insects;
  }

  getPowerUps(): PowerUp[] {
    return this.powerUps;
  }

  setPowerUps(powerUps: PowerUp[]): void {
    this.powerUps = powerUps;
  }

  reset(): void {
    this.insects = [];
    this.powerUps = [];
    this.entityIdCounter = 0;
    this.lastSpawnFrame = 0;
    this.lastPowerUpFrame = 0;
  }
}
