import test from 'node:test';
import assert from 'node:assert/strict';
import { isEnabledFlag } from '../src/utils/flags';

test('isEnabledFlag accepts truthy variants', () => {
  assert.equal(isEnabledFlag('1'), true);
  assert.equal(isEnabledFlag('true'), true);
  assert.equal(isEnabledFlag('TRUE'), true);
  assert.equal(isEnabledFlag(' yes '), true);
  assert.equal(isEnabledFlag('on'), true);
});

test('isEnabledFlag rejects other values', () => {
  assert.equal(isEnabledFlag('0'), false);
  assert.equal(isEnabledFlag('false'), false);
  assert.equal(isEnabledFlag('off'), false);
  assert.equal(isEnabledFlag(''), false);
  assert.equal(isEnabledFlag(null), false);
  assert.equal(isEnabledFlag(undefined), false);
});
