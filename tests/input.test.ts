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
