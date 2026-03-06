import test from 'node:test';
import assert from 'node:assert/strict';
import { moveInsects, updateScreenShake, advancePsyEffects } from '../src/utils/loop';

test('moveInsects moves insects down and marks hits', () => {
  const insects = [
    { id: 1, lane: 0, y: 100, speed: 5, spriteIndex: 0 } as any,
    { id: 2, lane: 1, y: 200, speed: 5, spriteIndex: 0 } as any,
  ];

  const result = moveInsects(insects, 600, false, 150, 1);

  assert.equal(result.insects[0].y, 105);
  assert.equal(result.insects[1].y, 205);
  assert.equal(result.reachedBottom, false);
});

test('moveInsects detects bottom hit when insect exceeds canvas', () => {
  const insect = { id: 1, lane: 0, y: 580, speed: 50, spriteIndex: 0 } as any;

  const result = moveInsects([insect], 600, false, 150, 1);

  assert.equal(result.reachedBottom, true);
});

test('moveInsects wraps insects in fever mode when they exceed canvas', () => {
  const insect = { id: 1, lane: 0, y: 590, speed: 20, spriteIndex: 0 } as any; // 590+20=610 > 600

  const result = moveInsects([insect], 600, true, 150, 1);

  assert.equal(result.reachedBottom, false);
  assert.ok(result.insects[0].y < 0); // wrapped to top
});

test('moveInsects handles empty array', () => {
  const result = moveInsects([], 600, false, 150, 1);

  assert.equal(result.insects.length, 0);
  assert.equal(result.reachedBottom, false);
});

test('moveInsects handles negative speeds', () => {
  const insect = { id: 1, lane: 0, y: 100, speed: -5, spriteIndex: 0 } as any;

  const result = moveInsects([insect], 600, false, 150, 1);

  assert.equal(result.insects[0].y, 95); // moves up
});

test('advancePsyEffects increments life and removes expired effects', () => {
  const effects = [
    { x: 10, y: 10, life: 0, maxLife: 30, hue: 180 } as any,
    { x: 20, y: 20, life: 29, maxLife: 30, hue: 180 } as any, // will be removed (30 not < 30)
    { x: 30, y: 30, life: 30, maxLife: 30, hue: 180 } as any, // removed
  ];

  const result = advancePsyEffects(effects);

  assert.equal(result.length, 1);
  assert.equal(result[0].life, 1);
});

test('advancePsyEffects handles empty array', () => {
  const result = advancePsyEffects([]);

  assert.equal(result.length, 0);
});

test('updateScreenShake decays shake and applies fever pulse', () => {
  let shake = updateScreenShake(10, false, 60);
  assert.equal(shake, 9); // decay by 1

  shake = updateScreenShake(0, true, 10); // frames % 10 === 0
  assert.equal(shake, 10); // fever pulse applies
});

test('updateScreenShake clamps negative to zero', () => {
  let shake = updateScreenShake(-5, false, 60);
  assert.equal(shake, 0); // clamped
});
