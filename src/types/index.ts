export interface Insect {
  id: number;
  lane: number;
  y: number;
  spriteIndex: number;
  speed: number;
  isFeverTarget?: boolean;
}

export interface PsyEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  hue: number;
}

export interface GameState {
  score: number;
  highScore: number;
  gameOver: boolean;
  isPlaying: boolean;
  isFeverMode: boolean;
  feverProgress: number;
  addScore: (points: number) => void;
  setGameOver: (status: boolean) => void;
  startGame: () => void;
  resetGame: () => void;
  setFeverMode: (status: boolean) => void;
}

export interface AssetPaths {
  IMAGES: {
    FALLING_1: string;
    FALLING_2: string;
    FALLING_3: string;
    FALLING_4: string;
    MASCOT_BG_1: string;
    MASCOT_BG_2: string;
    MASCOT_BG_3: string;
    MASCOT_BG_4: string;
    ANT_MASCOT_1: string;
    ANT_MASCOT_2: string;
    ANT_MASCOT_3: string;
    ANT_MASCOT_4: string;
  };
  ANIMATIONS: {
    IDLE_1: string;
    IDLE_2: string;
  };
}

export interface GameSettings {
  LANE_COUNT: number;
  TARGET_FPS: number;
  FEVER_THRESHOLD: number;
  TILE_HEIGHT: number;
  INITIAL_SPEED: number;
  SPEED_INCREMENT: number;
  MAX_SPEED: number;
}
