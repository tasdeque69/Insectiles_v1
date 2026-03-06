type LogLevel = 'info' | 'warn' | 'error';

const LOG_PREFIX = '[pinik-pipra]';
const LEVEL_PRIORITY: Record<LogLevel, number> = { info: 1, warn: 2, error: 3 };

const normalizeLevel = (value: string | undefined): LogLevel => {
  if (value === 'warn' || value === 'error' || value === 'info') return value;
  return 'info';
};

const formatMessage = (level: LogLevel, message: string) => {
  const timestamp = new Date().toISOString();
  return `${LOG_PREFIX} [${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const shouldEmit = (level: LogLevel, minLevel: LogLevel) => LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];

export const createLogger = (minLevel: LogLevel = 'info') => {
  const emit = (level: LogLevel, message: string, meta?: unknown) => {
    if (!shouldEmit(level, minLevel)) return;

    const payload = formatMessage(level, message);
    if (level === 'info') {
      if (meta === undefined) console.info(payload);
      else console.info(payload, meta);
      return;
    }

    if (level === 'warn') {
      if (meta === undefined) console.warn(payload);
      else console.warn(payload, meta);
      return;
    }

    if (meta === undefined) console.error(payload);
    else console.error(payload, meta);
  };

  return {
    info: (message: string, meta?: unknown) => emit('info', message, meta),
    warn: (message: string, meta?: unknown) => emit('warn', message, meta),
    error: (message: string, meta?: unknown) => emit('error', message, meta),
  };
};

const defaultLevel = normalizeLevel(
  typeof process !== 'undefined' ? process.env.PINIK_PIPRA_LOG_LEVEL : undefined
);

export const logger = createLogger(defaultLevel);
