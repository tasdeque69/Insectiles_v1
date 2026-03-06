import { useSyncExternalStore } from 'react';
import { GAME_SETTINGS } from '../constants';

const FEVER_THRESHOLD = GAME_SETTINGS.FEVER_THRESHOLD;

interface LeaderboardEntry {
  score: number;
  timestamp: number;
}

interface PersistedState {
  highScore: number;
  leaderboard: LeaderboardEntry[];
  soundEnabled: boolean;
}

interface GameState {
  score: number;
  highScore: number;
  gameOver: boolean;
  isPlaying: boolean;
  isFeverMode: boolean;
  feverProgress: number;
  comboMultiplier: number;
  comboStreak: number;
  soundEnabled: boolean;
  shieldCharges: number;
  slowMoUntil: number;
  leaderboard: LeaderboardEntry[];

  addScore: (points: number) => void;
  setGameOver: (status: boolean) => void;
  startGame: () => void;
  resetGame: () => void;
  setFeverMode: (status: boolean) => void;
  recordHit: () => number;
  recordMiss: () => void;
  consumeShield: () => boolean;
  activateShield: () => void;
  activateSlowMo: (durationMs: number) => void;
  toggleSound: () => void;
  addLeaderboardScore: (score: number) => void;
  isSlowMoActive: () => boolean;
}

type Updater = Partial<GameState> | ((state: GameState) => Partial<GameState>);

type StoreHook = (() => GameState) & {
  getState: () => GameState;
  setState: (updater: Updater) => void;
  subscribe: (listener: () => void) => () => void;
};

const PERSIST_KEY = 'pinik_pipra_state';
const MAX_LEADERBOARD = 5;

const readPersistedState = (): PersistedState => {
  const raw = localStorage.getItem(PERSIST_KEY);
  if (!raw) return { highScore: 0, leaderboard: [], soundEnabled: true };

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const highScore = Number.isFinite(parsed.highScore) ? Math.max(0, Math.floor(parsed.highScore as number)) : 0;
    const leaderboard = Array.isArray(parsed.leaderboard)
      ? parsed.leaderboard
          .filter((entry): entry is LeaderboardEntry => {
            const score = (entry as LeaderboardEntry).score;
            const timestamp = (entry as LeaderboardEntry).timestamp;
            return Number.isFinite(score) && Number.isFinite(timestamp) && score >= 0;
          })
          .slice(0, MAX_LEADERBOARD)
      : [];
    const soundEnabled = parsed.soundEnabled !== false;
    return { highScore, leaderboard, soundEnabled };
  } catch {
    return { highScore: 0, leaderboard: [], soundEnabled: true };
  }
};

const persistState = (next: GameState) => {
  const payload: PersistedState = {
    highScore: next.highScore,
    leaderboard: next.leaderboard.slice(0, MAX_LEADERBOARD),
    soundEnabled: next.soundEnabled,
  };
  localStorage.setItem(PERSIST_KEY, JSON.stringify(payload));
};

const persisted = readPersistedState();
const listeners = new Set<() => void>();

let state: GameState = {
  score: 0,
  highScore: persisted.highScore,
  gameOver: false,
  isPlaying: false,
  isFeverMode: false,
  feverProgress: 0,
  comboMultiplier: 1,
  comboStreak: 0,
  soundEnabled: persisted.soundEnabled,
  shieldCharges: 0,
  slowMoUntil: 0,
  leaderboard: persisted.leaderboard,

  addScore: (points) => {
    useGameStore.setState((current) => {
      const multiplier = current.comboMultiplier;
      const adjustedPoints = Math.floor(points * multiplier);
      const newScore = current.score + adjustedPoints;
      const newHighScore = Math.max(newScore, current.highScore);
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
    comboMultiplier: 1,
    comboStreak: 0,
    shieldCharges: 0,
    slowMoUntil: 0,
  }),

  resetGame: () => useGameStore.setState({
    score: 0,
    gameOver: false,
    isPlaying: false,
    isFeverMode: false,
    feverProgress: 0,
    comboMultiplier: 1,
    comboStreak: 0,
    shieldCharges: 0,
    slowMoUntil: 0,
  }),

  setFeverMode: (status) => useGameStore.setState({ isFeverMode: status }),

  recordHit: () => {
    const current = useGameStore.getState();
    const nextStreak = current.comboStreak + 1;
    const nextMultiplier = Math.min(5, 1 + Math.floor(nextStreak / 4));
    useGameStore.setState({ comboStreak: nextStreak, comboMultiplier: nextMultiplier });
    return nextMultiplier;
  },

  recordMiss: () => {
    useGameStore.setState((current) => {
      if (current.shieldCharges > 0) {
        return { shieldCharges: current.shieldCharges - 1 };
      }
      return { comboStreak: 0, comboMultiplier: 1 };
    });
  },

  consumeShield: () => {
    const current = useGameStore.getState();
    if (current.shieldCharges <= 0) return false;
    useGameStore.setState({ shieldCharges: current.shieldCharges - 1 });
    return true;
  },

  activateShield: () => {
    useGameStore.setState((current) => ({ shieldCharges: Math.min(3, current.shieldCharges + 1) }));
  },

  activateSlowMo: (durationMs) => {
    useGameStore.setState({ slowMoUntil: Date.now() + durationMs });
  },

  toggleSound: () => {
    useGameStore.setState((current) => ({ soundEnabled: !current.soundEnabled }));
  },

  addLeaderboardScore: (score) => {
    useGameStore.setState((current) => {
      const next = [...current.leaderboard, { score, timestamp: Date.now() }]
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LEADERBOARD);
      return { leaderboard: next };
    });
  },

  isSlowMoActive: () => Date.now() < useGameStore.getState().slowMoUntil,
};

const getState = () => state;

const setState = (updater: Updater) => {
  const nextPartial = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...nextPartial };
  persistState(state);
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

export { PERSIST_KEY, readPersistedState, FEVER_THRESHOLD };
