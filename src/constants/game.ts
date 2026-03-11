export const GAME_CONSTANTS = {
  LANES: 4,
  INITIAL_SPEED: 3,
  SPEED_INCREMENT: 0.1,
  FEVER_SCORE_THRESHOLD: 500,
  FEVER_DURATION: 600,
  SPAWN_RATE: 100,
  HIT_TOLERANCE: 100,
  TILE_HEIGHT: 200,
  DISTANCE_BETWEEN_INSECTS: 250,
  INPUT_DEBOUNCE_MS: 30,
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 800,
} as const;

export const AUDIO_CONSTANTS = {
  DEFAULT_BPM: 142,
  BEAT_INTERVAL_MS: 60000 / 142,
  FFT_SIZE: 2048,
  SMOOTHING_TIME_CONSTANT: 0.8,
} as const;

export const VISUAL_CONSTANTS = {
  HUE_ROTATION_SPEED: 0.5,
  FEVER_HUE_ROTATION_SPEED: 2,
  SHAKE_DECAY: 0.9,
  FLASH_DECAY: 0.1,
  PARTICLE_LIFETIME: 60,
  EFFECT_LIFETIME: 30,
} as const;

export const STORAGE_KEYS = {
  GAME_DATA: 'insectiles_data',
  SETTINGS: 'insectiles_settings',
  LEADERBOARD_CACHE: 'insectiles_leaderboard',
} as const;

export const INSECT_TYPES = {
  WEED_ANT: 'weed_ant',
  RAINBOW_ANT: 'rainbow_ant',
  NEON_ANT: 'neon_ant',
  ALIEN_BUG: 'alien_bug',
  FIRE_ICE_ANT: 'fire_ice_ant',
  LADYBUG: 'ladybug',
} as const;

export const EFFECT_TYPES = {
  MANDALA: 'mandala',
  BUDDHA: 'buddha',
  KALEIDOSCOPE: 'kaleidoscope',
  PROFILE: 'profile',
} as const;
