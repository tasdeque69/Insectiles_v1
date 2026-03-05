import { useSyncExternalStore } from 'react';

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

type Updater = Partial<GameState> | ((state: GameState) => Partial<GameState>);

type StoreHook = (() => GameState) & {
  getState: () => GameState;
  setState: (updater: Updater) => void;
  subscribe: (listener: () => void) => () => void;
};


const HIGHSCORE_KEY = 'pinik_pipra_highscore';
const FEVER_THRESHOLD = 500;

const readPersistedHighScore = () => {
  const raw = localStorage.getItem(HIGHSCORE_KEY);
  if (raw === null) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};
const listeners = new Set<() => void>();

let state: GameState = {
  score: 0,
  highScore: readPersistedHighScore(),
  gameOver: false,
  isPlaying: false,
  isFeverMode: false,
  feverProgress: 0,

  addScore: (points) => {
    useGameStore.setState((current) => {
      const newScore = current.score + points;
      const newHighScore = Math.max(newScore, current.highScore);
      if (newHighScore > current.highScore) {
        localStorage.setItem(HIGHSCORE_KEY, newHighScore.toString());
      }
      return {
        score: newScore,
        highScore: newHighScore,
        feverProgress: Math.min(newScore / FEVER_THRESHOLD, 1),
      };
    });
  },

  setGameOver: (status) => useGameStore.setState({ gameOver: status, isPlaying: !status }),

  startGame: () => useGameStore.setState({
    isPlaying: true,
    gameOver: false,
    score: 0,
    isFeverMode: false,
    feverProgress: 0,
  }),

  resetGame: () => useGameStore.setState({
    score: 0,
    gameOver: false,
    isPlaying: false,
    isFeverMode: false,
    feverProgress: 0,
  }),

  setFeverMode: (status) => useGameStore.setState({ isFeverMode: status }),
};

const getState = () => state;

const setState = (updater: Updater) => {
  const nextPartial = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...nextPartial };
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useGameStore = Object.assign(
  function useGameStoreHook() {
    return useSyncExternalStore(subscribe, getState, getState);
  },
  { getState, setState, subscribe }
) as StoreHook;

export { readPersistedHighScore, HIGHSCORE_KEY, FEVER_THRESHOLD };
