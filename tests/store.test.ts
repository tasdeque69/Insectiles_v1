import test from 'node:test';
import assert from 'node:assert/strict';
import { FEVER_THRESHOLD, HIGHSCORE_KEY, readPersistedHighScore, useGameStore } from '../src/store/useGameStore';

const resetStore = () => {
  localStorage.clear();
  useGameStore.setState({
    score: 0,
    highScore: 0,
    gameOver: false,
    isPlaying: false,
    isFeverMode: false,
    feverProgress: 0,
  });
};

test('readPersistedHighScore clamps invalid values', () => {
  localStorage.setItem(HIGHSCORE_KEY, 'not-a-number');
  assert.equal(readPersistedHighScore(), 0);

  localStorage.setItem(HIGHSCORE_KEY, '-42');
  assert.equal(readPersistedHighScore(), 0);

  localStorage.setItem(HIGHSCORE_KEY, '143.8');
  assert.equal(readPersistedHighScore(), 143);
});

test('startGame initializes playable defaults', () => {
  resetStore();
  useGameStore.getState().startGame();
  const state = useGameStore.getState();

  assert.equal(state.isPlaying, true);
  assert.equal(state.gameOver, false);
  assert.equal(state.score, 0);
  assert.equal(state.isFeverMode, false);
  assert.equal(state.feverProgress, 0);
});

test('addScore updates score/high score and persists to localStorage', () => {
  resetStore();
  useGameStore.getState().addScore(120);

  let state = useGameStore.getState();
  assert.equal(state.score, 120);
  assert.equal(state.highScore, 120);
  assert.equal(localStorage.getItem(HIGHSCORE_KEY), '120');

  useGameStore.getState().addScore(10);
  state = useGameStore.getState();

  assert.equal(state.score, 130);
  assert.equal(state.highScore, 130);
  assert.equal(localStorage.getItem(HIGHSCORE_KEY), '130');
});

test('fever progress is capped at 1', () => {
  resetStore();
  useGameStore.getState().addScore(FEVER_THRESHOLD * 2);
  assert.equal(useGameStore.getState().feverProgress, 1);
});
