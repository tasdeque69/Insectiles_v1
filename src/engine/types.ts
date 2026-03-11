export interface InsectDef {
  type: string;
  emojis: string[];
  rainbow?: boolean;
  color?: string;
  gradient?: string[];
}

export interface Insect {
  id: number;
  lane: number;
  y: number;
  def: InsectDef;
  speed: number;
  scored: boolean;
}

export interface PsyEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  hue: number;
  type: 'mandala' | 'buddha' | 'kaleidoscope' | 'profile';
}

export interface GameState {
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

export interface GameConfig {
  FEVER_SCORE_THRESHOLD: number;
  FEVER_DURATION: number;
  LANES: number;
  INITIAL_SPEED: number;
  SPEED_INCREMENT: number;
  SPAWN_RATE: number;
  HIT_TOLERANCE: number;
  TILE_HEIGHT: number;
  DISTANCE_BETWEEN_INSECTS: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  FEVER_SCORE_THRESHOLD: 500,
  FEVER_DURATION: 600,
  LANES: 4,
  INITIAL_SPEED: 3,
  SPEED_INCREMENT: 0.1,
  SPAWN_RATE: 100,
  HIT_TOLERANCE: 100,
  TILE_HEIGHT: 200,
  DISTANCE_BETWEEN_INSECTS: 250,
};

export const INSECT_DEFS: InsectDef[] = [
  { type: 'weed_ant', emojis: ['🌿', '🐜'] },
  { type: 'rainbow_ant', emojis: ['🐜'], rainbow: true },
  { type: 'neon_ant', emojis: ['🐜'], color: 'rgba(200, 0, 255, 0.8)' },
  { type: 'alien_bug', emojis: ['👽', '🐛'] },
  { type: 'fire_ice_ant', emojis: ['🐜'], gradient: ['rgba(255,0,0,0.8)', 'rgba(0,200,255,0.8)'] }
];

export const SPECIAL_INSECT_DEF: InsectDef = { type: 'ladybug', emojis: ['🍁', '🐞'] };

export type GameEventType = 'score' | 'gameOver' | 'feverStart' | 'feverEnd' | 'spawn';

export interface GameEvent {
  type: GameEventType;
  data?: Record<string, unknown>;
}
