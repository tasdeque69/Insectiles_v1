import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaneFromClientX } from '../src/utils/input';

test('maps client x into correct lane index', () => {
  assert.equal(getLaneFromClientX(110, 100, 400, 4), 0);
  assert.equal(getLaneFromClientX(220, 100, 400, 4), 1);
  assert.equal(getLaneFromClientX(320, 100, 400, 4), 2);
  assert.equal(getLaneFromClientX(499, 100, 400, 4), 3);
});

test('returns -1 for out-of-bounds coordinates', () => {
  assert.equal(getLaneFromClientX(99, 100, 400, 4), -1);
  assert.equal(getLaneFromClientX(500, 100, 400, 4), -1);
});

test('returns -1 for invalid geometry inputs', () => {
  assert.equal(getLaneFromClientX(120, 100, 0, 4), -1);
  assert.equal(getLaneFromClientX(120, 100, 400, 0), -1);
});

test('handles fractional lane boundaries correctly', () => {
  // 400px width, 4 lanes = 100px each, boundaries at 100, 200, 300, 400 (canvasLeft=0)
  // Test exactly on boundary (should map to that lane due to floor)
  assert.equal(getLaneFromClientX(100, 0, 400, 4), 1);
  assert.equal(getLaneFromClientX(200, 0, 400, 4), 2);
  assert.equal(getLaneFromClientX(299.999, 0, 400, 4), 2);
  assert.equal(getLaneFromClientX(300.001, 0, 400, 4), 3);
});

test('handles single lane layout', () => {
  // With 1 lane, any valid x within canvas should map to lane 0
  assert.equal(getLaneFromClientX(150, 100, 200, 1), 0);
  assert.equal(getLaneFromClientX(199, 100, 200, 1), 0);
  assert.equal(getLaneFromClientX(300, 100, 200, 1), -1); // outside
});

test('handles negative canvasLeft offset', () => {
  // canvas starts left of viewport (negative left)
  // canvas from -100 to 300 (400 width). clientX=50 is 150px from left edge -> lane 1
  assert.equal(getLaneFromClientX(50, -100, 400, 4), 1);
  assert.equal(getLaneFromClientX(-50, -100, 400, 4), 0); // just inside left edge at -100+0?
});

test('precision handling with very small lanes', () => {
  // 1000px width, 100 lanes = 10px each
  assert.equal(getLaneFromClientX(0, 0, 1000, 100), 0);
  assert.equal(getLaneFromClientX(9.9, 0, 1000, 100), 0);
  assert.equal(getLaneFromClientX(10, 0, 1000, 100), 1);
  assert.equal(getLaneFromClientX(999.9, 0, 1000, 100), 99);
});
