import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogger, logger } from '../src/utils/logger';

test('logger methods do not throw with metadata payloads', () => {
  assert.doesNotThrow(() => logger.info('info message', { scope: 'test' }));
  assert.doesNotThrow(() => logger.warn('warn message', { scope: 'test' }));
  assert.doesNotThrow(() => logger.error('error message', { scope: 'test' }));
});

test('createLogger respects minimum level filtering', () => {
  let infoCalls = 0;
  let warnCalls = 0;
  let errorCalls = 0;

  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.info = () => { infoCalls += 1; };
  console.warn = () => { warnCalls += 1; };
  console.error = () => { errorCalls += 1; };

  try {
    const warnLogger = createLogger('warn');
    warnLogger.info('suppressed');
    warnLogger.warn('shown');
    warnLogger.error('shown');
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  }

  assert.equal(infoCalls, 0);
  assert.equal(warnCalls, 1);
  assert.equal(errorCalls, 1);
});
