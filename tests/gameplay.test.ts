import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHitScore, FEVER_HIT_SCORE, findTopTargetInLane, NORMAL_HIT_SCORE } from '../src/utils/gameplay';

test('calculateHitScore returns proper points by mode', () => {
  assert.equal(calculateHitScore(false), NORMAL_HIT_SCORE);
  assert.equal(calculateHitScore(true), FEVER_HIT_SCORE);
});

test('findTopTargetInLane returns lowest visible insect in lane', () => {
  const insects = [
    { id: 1, lane: 0, y: 40 },
    { id: 2, lane: 1, y: 25 },
    { id: 3, lane: 0, y: 80 },
    { id: 4, lane: 0, y: 55 },
  ];

  const target = findTopTargetInLane(insects, 0);
  assert.ok(target);
  assert.equal(target.id, 3);
});

test('findTopTargetInLane returns undefined for empty lane', () => {
  const insects = [{ id: 1, lane: 0, y: 40 }];
  const target = findTopTargetInLane(insects, 2);
  assert.equal(target, undefined);
});
