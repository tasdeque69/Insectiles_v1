import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGameSpeed, calculateSpawnInterval, shouldActivateFeverMode } from '../src/utils/gameRules';

test('shouldActivateFeverMode only triggers when threshold reached and not active yet', () => {
  assert.equal(shouldActivateFeverMode(499, 500, false), false);
  assert.equal(shouldActivateFeverMode(500, 500, false), true);
  assert.equal(shouldActivateFeverMode(900, 500, true), false);
});

test('calculateSpawnInterval scales with score and clamps at minimum value', () => {
  assert.equal(calculateSpawnInterval({ isFeverMode: false, score: 0 }), 100);
  assert.equal(calculateSpawnInterval({ isFeverMode: false, score: 300 }), 70);
  assert.equal(calculateSpawnInterval({ isFeverMode: false, score: 900 }), 20);
  assert.equal(calculateSpawnInterval({ isFeverMode: true, score: 0 }), 30);
  assert.equal(calculateSpawnInterval({ isFeverMode: true, score: 500 }), 20);
});

test('calculateGameSpeed scales and clamps at max speed', () => {
  assert.equal(calculateGameSpeed({ score: 0, initialSpeed: 4, speedIncrement: 0.1, maxSpeed: 12 }), 4);
  assert.equal(calculateGameSpeed({ score: 20, initialSpeed: 4, speedIncrement: 0.1, maxSpeed: 12 }), 6);
  assert.equal(calculateGameSpeed({ score: 400, initialSpeed: 4, speedIncrement: 0.1, maxSpeed: 12 }), 12);
});
