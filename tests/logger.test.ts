import test from 'node:test';
import assert from 'node:assert/strict';
import { logger } from '../src/utils/logger';

test('logger methods do not throw with metadata payloads', () => {
  assert.doesNotThrow(() => logger.info('info message', { scope: 'test' }));
  assert.doesNotThrow(() => logger.warn('warn message', { scope: 'test' }));
  assert.doesNotThrow(() => logger.error('error message', { scope: 'test' }));
});
