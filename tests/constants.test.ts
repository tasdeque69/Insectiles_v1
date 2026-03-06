import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_PATHS, GAME_SETTINGS } from '../src/constants';

test('game settings include fever threshold and lane count', () => {
  assert.equal(GAME_SETTINGS.LANE_COUNT, 4);
  assert.equal(GAME_SETTINGS.FEVER_THRESHOLD, 500);
  assert.ok(GAME_SETTINGS.MAX_SPEED > GAME_SETTINGS.INITIAL_SPEED);
});

test('asset path registry includes expected total assets', () => {
  assert.equal(Object.keys(ASSET_PATHS.IMAGES).length, 18);
  assert.equal(Object.keys(ASSET_PATHS.ANIMATIONS).length, 2);
});
