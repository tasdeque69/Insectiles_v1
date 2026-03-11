import {
  Insect,
  PsyEffect,
  GameState,
  GameConfig,
  DEFAULT_CONFIG,
  INSECT_DEFS,
  SPECIAL_INSECT_DEF,
  GameEvent,
  GameEventType,
} from './types';

type EventCallback = (event: GameEvent) => void;

export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private listeners: Set<EventCallback> = new Set();
  private canvasWidth: number = 400;
  private canvasHeight: number = 800;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      insects: [],
      psyEffects: [],
      speed: this.config.INITIAL_SPEED,
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
    };
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public getInsects(): Readonly<Insect[]> {
    return this.state.insects;
  }

  public getPsyEffects(): Readonly<PsyEffect[]> {
    return this.state.psyEffects;
  }

  public getScore(): number {
    return this.state.score;
  }

  public isPlaying(): boolean {
    return this.state.isPlaying;
  }

  public isGameOver(): boolean {
    return this.state.gameOver;
  }

  public isFeverMode(): boolean {
    return this.state.feverMode;
  }

  public getHue(): number {
    return this.state.hue;
  }

  public getShake(): number {
    return this.state.shake;
  }

  public getFlash(): number {
    return this.state.flash;
  }

  public getSpeed(): number {
    return this.state.speed;
  }

  public subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(type: GameEventType, data?: Record<string, unknown>): void {
    const event: GameEvent = { type, data };
    this.listeners.forEach((callback) => callback(event));
  }

  public start(): void {
    this.state = this.createInitialState();
    this.state.isPlaying = true;
    this.spawnInsect();
    this.emit('score', { score: 0 });
  }

  public stop(): void {
    this.state.isPlaying = false;
    this.state.gameOver = true;
    this.emit('gameOver', { score: this.state.score });
  }

  private spawnInsect(): void {
    const lane = Math.floor(Math.random() * this.config.LANES);
    const isFever = this.state.feverMode;
    const def = isFever
      ? SPECIAL_INSECT_DEF
      : INSECT_DEFS[Math.floor(Math.random() * INSECT_DEFS.length)];

    this.state.insects.push({
      id: this.state.insectIdCounter++,
      lane,
      y: -100,
      def,
      speed: this.state.speed,
      scored: false,
    });

    this.emit('spawn', { lane, isFever });
  }

  public handleTap(x: number, y: number): boolean {
    if (!this.state.isPlaying || this.state.gameOver) {
      return false;
    }

    const laneWidth = this.canvasWidth / this.config.LANES;
    const clickedLane = Math.floor(x / laneWidth);

    const targetInsect = this.state.insects
      .filter((i) => i.lane === clickedLane && !i.scored)
      .sort((a, b) => b.y - a.y)[0];

    const lowestOverall = this.state.insects
      .filter((i) => !i.scored)
      .sort((a, b) => b.y - a.y)[0];

    const isWithinVerticalRange =
      targetInsect &&
      Math.abs(y - targetInsect.y) < this.config.TILE_HEIGHT + this.config.HIT_TOLERANCE;

    if (targetInsect && targetInsect === lowestOverall && isWithinVerticalRange) {
      this.processSuccessfulTap(targetInsect, x, y, laneWidth);
      return true;
    } else {
      this.stop();
      return false;
    }
  }

  private processSuccessfulTap(
    insect: Insect,
    x: number,
    y: number,
    laneWidth: number
  ): void {
    const isSpecial = insect.def.type === 'ladybug';

    insect.scored = true;
    const points = isSpecial ? 2 : 1;
    const prevScore = this.state.score;
    this.state.score += points;

    if (
      !this.state.feverMode &&
      Math.floor(prevScore / this.config.FEVER_SCORE_THRESHOLD) <
        Math.floor(this.state.score / this.config.FEVER_SCORE_THRESHOLD)
    ) {
      this.state.feverMode = true;
      this.state.feverFramesLeft = this.config.FEVER_DURATION;
      this.emit('feverStart', { duration: this.config.FEVER_DURATION });
    }

    this.state.speed = this.config.INITIAL_SPEED + this.state.score * this.config.SPEED_INCREMENT;

    this.state.psyEffects.push({
      x,
      y,
      life: 0,
      maxLife: 30,
      hue: (this.state.hue + 180) % 360,
      type: 'kaleidoscope',
    });

    const effectTypes: ('mandala' | 'buddha' | 'kaleidoscope' | 'profile')[] = [
      'mandala',
      'buddha',
      'kaleidoscope',
      'profile',
    ];
    const randomType = effectTypes[Math.floor(Math.random() * effectTypes.length)];

    this.state.psyEffects.push({
      x: insect.lane * laneWidth + laneWidth / 2,
      y: insect.y + 40,
      life: 0,
      maxLife: 60,
      hue: this.state.hue,
      type: randomType,
    });

    this.state.shake = isSpecial ? 40 : 25;
    this.state.flash = isSpecial ? 0.8 : 0.4;
    this.state.hue += isSpecial ? 60 : 30;

    this.emit('score', { score: this.state.score, isSpecial });
  }

  public update(): void {
    if (!this.state.isPlaying || this.state.gameOver) {
      return;
    }

    this.state.frames++;
    this.state.hue = (this.state.hue + (this.state.feverMode ? 2 : 0.5)) % 360;

    if (this.state.feverFramesLeft > 0) {
      this.state.feverFramesLeft--;
      if (this.state.feverFramesLeft <= 0) {
        this.state.feverMode = false;
        this.emit('feverEnd', {});
      }
    }

    const currentSpawnRate = Math.max(
      10,
      this.config.DISTANCE_BETWEEN_INSECTS / this.state.speed
    );
    if (this.state.frames - this.state.lastSpawnFrame > currentSpawnRate) {
      this.spawnInsect();
      this.state.lastSpawnFrame = this.state.frames;
    }

    // Update insects - filter out scored insects in single pass
    this.state.insects = this.state.insects.filter((insect) => {
      if (!insect.scored) {
        insect.y += this.state.speed;
        // Check for game over
        if (insect.y + this.config.TILE_HEIGHT / 2 >= this.canvasHeight) {
          this.stop();
          return true; // Keep for now, will be cleaned up on next frame
        }
        return true;
      }
      return false; // Remove scored insects
    });

    // Early exit if game was stopped
    if (!this.state.isPlaying) {
      return;
    }

    // Update psyEffects - filter out expired effects in single pass
    this.state.psyEffects = this.state.psyEffects
      .map((p) => ({ ...p, life: p.life + 1 }))
      .filter((p) => p.life < p.maxLife);

    if (this.state.flash > 0) {
      this.state.flash -= 0.1;
      if (this.state.flash < 0) this.state.flash = 0;
    }
  }

  public reset(): void {
    this.state = this.createInitialState();
  }
}

export default GameEngine;
