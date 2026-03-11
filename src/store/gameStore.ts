import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export interface GameStore {
  score: number;
  highScore: number;
  isPlaying: boolean;
  gameOver: boolean;
  feverMode: boolean;
  settings: GameSettings;

  startGame: () => void;
  endGame: () => void;
  incrementScore: (amount: number) => void;
  setFeverMode: (active: boolean) => void;
  reset: () => void;
  updateHighScore: (score: number) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.8,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      score: 0,
      highScore: 0,
      isPlaying: false,
      gameOver: false,
      feverMode: false,
      settings: defaultSettings,

      startGame: () =>
        set({
          score: 0,
          isPlaying: true,
          gameOver: false,
          feverMode: false,
        }),

      endGame: () => {
        const { score, highScore } = get();
        set({
          isPlaying: false,
          gameOver: true,
          highScore: Math.max(score, highScore),
        });
      },

      incrementScore: (amount: number) =>
        set((state) => ({ score: state.score + amount })),

      setFeverMode: (active: boolean) => set({ feverMode: active }),

      reset: () =>
        set({
          score: 0,
          isPlaying: false,
          gameOver: false,
          feverMode: false,
        }),

      updateHighScore: (score: number) =>
        set((state) => ({
          highScore: Math.max(score, state.highScore),
        })),

      updateSettings: (newSettings: Partial<GameSettings>) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'insectiles-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        highScore: state.highScore,
        settings: state.settings,
      }),
    }
  )
);

export default useGameStore;
