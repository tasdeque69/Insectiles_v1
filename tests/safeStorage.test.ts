import test from 'node:test';
import assert from 'node:assert/strict';
import { safeStorage } from '../src/utils/safeStorage';

test('safeStorage mirrors values into localStorage when available', () => {
  localStorage.clear();
  safeStorage.removeItem('safe:key');

  safeStorage.setItem('safe:key', 'value-1');

  assert.equal(safeStorage.getItem('safe:key'), 'value-1');
  assert.equal(localStorage.getItem('safe:key'), 'value-1');
});

test('safeStorage falls back to memory when localStorage throws', () => {
  const originalGet = localStorage.getItem.bind(localStorage);
  const originalSet = localStorage.setItem.bind(localStorage);
  const originalRemove = localStorage.removeItem.bind(localStorage);

  try {
    localStorage.getItem = (() => {
      throw new Error('blocked');
    }) as Storage['getItem'];
    localStorage.setItem = (() => {
      throw new Error('blocked');
    }) as Storage['setItem'];
    localStorage.removeItem = (() => {
      throw new Error('blocked');
    }) as Storage['removeItem'];

    safeStorage.setItem('safe:block', 'fallback-value');
    assert.equal(safeStorage.getItem('safe:block'), 'fallback-value');
    safeStorage.removeItem('safe:block');
    assert.equal(safeStorage.getItem('safe:block'), null);
  } finally {
    localStorage.getItem = originalGet;
    localStorage.setItem = originalSet;
    localStorage.removeItem = originalRemove;
  }
});

test('safeStorage returns fallback value if localStorage misses key', () => {
  const originalGet = localStorage.getItem.bind(localStorage);
  safeStorage.setItem('safe:shadow', 'cached');

  try {
    localStorage.getItem = (() => null) as Storage['getItem'];
    assert.equal(safeStorage.getItem('safe:shadow'), 'cached');
  } finally {
    localStorage.getItem = originalGet;
    safeStorage.removeItem('safe:shadow');
  }
});

test('safeStorage.getUsage returns storage estimate', () => {
  localStorage.clear();
  safeStorage.setItem('safe:usage:test', 'test-value');
  
  const usage = safeStorage.getUsage();
  assert.ok(usage.used > 0, 'should estimate used storage');
  assert.ok(usage.quota > 0, 'should have quota');
  assert.ok(usage.percent >= 0, 'should have percent');
  assert.ok(usage.percent < 100, 'should be under 100%');
  
  safeStorage.removeItem('safe:usage:test');
});
