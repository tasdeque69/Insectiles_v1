export interface StoredGameData {
  highScore: number;
  totalPlays: number;
  lastPlayed: string;
  achievements: string[];
}

export interface StoredSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export interface StoredData {
  game: StoredGameData;
  settings: StoredSettings;
}

const STORAGE_KEY = 'insectiles_data';

const defaultGameData: StoredGameData = {
  highScore: 0,
  totalPlays: 0,
  lastPlayed: '',
  achievements: [],
};

const defaultSettings: StoredSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.8,
};

export const saveGameData = (data: Partial<StoredData>): boolean => {
  try {
    const existing = loadGameData();
    const merged: StoredData = {
      game: { ...defaultGameData, ...existing?.game, ...data.game },
      settings: { ...defaultSettings, ...existing?.settings, ...data.settings },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (error) {
    console.error('Failed to save game data:', error);
    return false;
  }
};

export const loadGameData = (): StoredData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as StoredData;
  } catch (error) {
    console.error('Failed to load game data:', error);
    return null;
  }
};

export const clearGameData = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear game data:', error);
    return false;
  }
};

export const updateHighScore = (score: number): boolean => {
  const data = loadGameData();
  const currentHighScore = data?.game.highScore ?? 0;
  if (score > currentHighScore) {
    return saveGameData({
      game: { highScore: score, totalPlays: data?.game.totalPlays ?? 0, lastPlayed: data?.game.lastPlayed ?? '', achievements: data?.game.achievements ?? [] },
    });
  }
  return true;
};

export const incrementTotalPlays = (): boolean => {
  const data = loadGameData();
  const currentPlays = data?.game.totalPlays ?? 0;
  return saveGameData({
    game: {
      highScore: data?.game.highScore ?? 0,
      totalPlays: currentPlays + 1,
      lastPlayed: new Date().toISOString(),
      achievements: data?.game.achievements ?? [],
    },
  });
};

export const unlockAchievement = (achievementId: string): boolean => {
  const data = loadGameData();
  const achievements = data?.game.achievements ?? [];
  if (!achievements.includes(achievementId)) {
    return saveGameData({
      game: {
        highScore: data?.game.highScore ?? 0,
        totalPlays: data?.game.totalPlays ?? 0,
        lastPlayed: data?.game.lastPlayed ?? '',
        achievements: [...achievements, achievementId],
      },
    });
  }
  return true;
};

export const hasAchievement = (achievementId: string): boolean => {
  const data = loadGameData();
  return data?.game.achievements.includes(achievementId) ?? false;
};
