import test from 'node:test';
import assert from 'node:assert/strict';
import { FEVER_THRESHOLD, PERSIST_KEY, readPersistedState, useGameStore } from '../src/store/useGameStore';

const resetStore = () => {
  localStorage.clear();
  useGameStore.setState({
    score: 0,
    highScore: 0,
    gameOver: false,
    isPlaying: false,
    isFeverMode: false,
    feverProgress: 0,
    comboMultiplier: 1,
    comboStreak: 0,
    soundEnabled: true,
    shieldCharges: 0,
    slowMoUntil: 0,
    leaderboard: [],
  });
};

test('readPersistedState returns defaults when no data', () => {
  localStorage.clear();
  const state = readPersistedState();
  assert.equal(state.highScore, 0);
  assert.deepEqual(state.leaderboard, []);
  assert.equal(state.soundEnabled, true);
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
  assert.equal(state.comboMultiplier, 1);
  assert.equal(state.comboStreak, 0);
  assert.equal(state.shieldCharges, 0);
});

test('addScore respects combo multiplier', () => {
  resetStore();
  const store = useGameStore.getState();

  store.addScore(100); // 100 * 1 = 100
  assert.equal(useGameStore.getState().score, 100);

  // Simulate hits to build combo
  store.recordHit(); // streak 1, mult 1
  store.recordHit(); // streak 2, mult 1
  store.recordHit(); // streak 3, mult 1
  store.recordHit(); // streak 4, mult 2

  store.addScore(100); // 100 * 2 = 200
  assert.equal(useGameStore.getState().score, 300);
  assert.equal(useGameStore.getState().comboMultiplier, 2);
});

test('recordMiss resets combo or consumes shield', () => {
  resetStore();
  const store = useGameStore.getState();

  // Build combo
  for (let i = 0; i < 4; i++) store.recordHit();
  assert.equal(useGameStore.getState().comboMultiplier, 2);

  // Miss without shield should reset combo
  store.recordMiss();
  assert.equal(useGameStore.getState().comboMultiplier, 1);
  assert.equal(useGameStore.getState().comboStreak, 0);
});

test('shield mechanics work correctly', () => {
  resetStore();
  const store = useGameStore.getState();

  assert.equal(store.shieldCharges, 0);

  store.activateShield();
  assert.equal(useGameStore.getState().shieldCharges, 1);

  store.activateShield();
  store.activateShield(); // max 3
  assert.equal(useGameStore.getState().shieldCharges, 3);

  // Consume shield
  const consumed = store.consumeShield();
  assert.equal(consumed, true);
  assert.equal(useGameStore.getState().shieldCharges, 2);

  // Try consume when empty
  useGameStore.getState().shieldCharges = 0;
  const failed = store.consumeShield();
  assert.equal(failed, false);
});

test('slow-mo activation and check', () => {
  resetStore();
  const store = useGameStore.getState();

  assert.equal(store.isSlowMoActive(), false);

  store.activateSlowMo(1000);
  assert.equal(useGameStore.getState().isSlowMoActive(), true);

  // Expire manually (test would need time travel)
  useGameStore.getState().slowMoUntil = Date.now() - 100;
  assert.equal(useGameStore.getState().isSlowMoActive(), false);
});

test('toggleSound switches state', () => {
  resetStore();
  const store = useGameStore.getState();

  assert.equal(store.soundEnabled, true);
  store.toggleSound();
  assert.equal(useGameStore.getState().soundEnabled, false);
  store.toggleSound();
  assert.equal(useGameStore.getState().soundEnabled, true);
});

test('leaderboard maintains top 5 scores sorted', () => {
  resetStore();
  const store = useGameStore.getState();

  store.addLeaderboardScore(100);
  store.addLeaderboardScore(300);
  store.addLeaderboardScore(200);
  store.addLeaderboardScore(500);
  store.addLeaderboardScore(400);
  store.addLeaderboardScore(250); // 6th, should not appear

  const { leaderboard } = useGameStore.getState();
  assert.equal(leaderboard.length, 5);
  assert.deepEqual(leaderboard.map(e => e.score), [500, 400, 300, 250, 200]);
});

test('fever progress is capped at 1', () => {
  resetStore();
  useGameStore.getState().addScore(FEVER_THRESHOLD * 2);
  assert.equal(useGameStore.getState().feverProgress, 1);
});

test('setGameOver toggles isPlaying and gameOver flags', () => {
  resetStore();
  const store = useGameStore.getState();

  store.setGameOver(true);
  let state = useGameStore.getState();
  assert.equal(state.gameOver, true);
  assert.equal(state.isPlaying, false);

  store.setGameOver(false);
  state = useGameStore.getState();
  assert.equal(state.gameOver, false);
  assert.equal(state.isPlaying, true);
});

test('setFeverMode updates isFeverMode and respects combo', () => {
  resetStore();
  const store = useGameStore.getState();

  store.addScore(250);
  assert.equal(useGameStore.getState().feverProgress, 0.5);

  store.setFeverMode(true);
  assert.equal(useGameStore.getState().isFeverMode, true);
});

test('state persists to localStorage', () => {
  resetStore();
  const store = useGameStore.getState();

  store.addScore(1234);
  store.toggleSound();
  store.activateShield();

  // Simulate app restart by reading from localStorage
  const raw = localStorage.getItem(PERSIST_KEY);
  assert.ok(raw);

  const persisted = JSON.parse(raw);
  assert.equal(persisted.highScore, 1234);
  assert.equal(persisted.soundEnabled, false);
  assert.ok(Array.isArray(persisted.leaderboard));
});

