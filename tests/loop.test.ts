import test from 'node:test';
import assert from 'node:assert/strict';
import { advancePsyEffects, moveInsects, updateScreenShake } from '../src/utils/loop';

test('updateScreenShake decays shake and applies fever pulse', () => {
  assert.equal(updateScreenShake(10, false, 1), 9);
  assert.equal(updateScreenShake(0, true, 10), 10);
  assert.equal(updateScreenShake(5, true, 11), 4.5);
});

test('advancePsyEffects increments life and removes expired effects', () => {
  const next = advancePsyEffects([
    { life: 0, maxLife: 2, id: 'a' },
    { life: 1, maxLife: 2, id: 'b' },
  ]);

  assert.equal(next.length, 1);
  assert.equal(next[0].id, 'a');
  assert.equal(next[0].life, 1);
});

test('moveInsects marks bottom hit in normal mode', () => {
  const result = moveInsects([{ y: 95, speed: 10 }], 100, false, 150);
  assert.equal(result.reachedBottom, true);
  assert.equal(result.insects[0].y, 105);
});

test('moveInsects wraps insects in fever mode', () => {
  const result = moveInsects([{ y: 95, speed: 10 }], 100, true, 150);
  assert.equal(result.reachedBottom, false);
  assert.equal(result.insects[0].y, -150);
});
