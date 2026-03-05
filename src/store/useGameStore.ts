import { create } from 'zustand';

interface GameState {
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

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  highScore: Number(localStorage.getItem('pinik_pipra_highscore')) || 0,
  gameOver: false,
  isPlaying: false,
  isFeverMode: false,
  feverProgress: 0,

  addScore: (points) => set((state) => {
    const newScore = state.score + points;
    const newHighScore = Math.max(newScore, state.highScore);
    if (newHighScore > state.highScore) {
      localStorage.setItem('pinik_pipra_highscore', newHighScore.toString());
    }
    return {
      score: newScore,
      highScore: newHighScore,
      feverProgress: Math.min(newScore / 500, 1)
    };
  }),

  setGameOver: (status) => set({ gameOver: status, isPlaying: !status }),

  startGame: () => set({
    isPlaying: true,
    gameOver: false,
    score: 0,
    isFeverMode: false,
    feverProgress: 0
  }),

  resetGame: () => set({
    score: 0,
    gameOver: false,
    isPlaying: false,
    isFeverMode: false,
    feverProgress: 0
  }),

  setFeverMode: (status) => set({ isFeverMode: status }),
}));
