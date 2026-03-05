type LogLevel = 'info' | 'warn' | 'error';

const LOG_PREFIX = '[pinik-pipra]';

const emit = (level: LogLevel, message: string, meta?: unknown) => {
  const payload = `${LOG_PREFIX} ${message}`;
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

export const logger = {
  info: (message: string, meta?: unknown) => emit('info', message, meta),
  warn: (message: string, meta?: unknown) => emit('warn', message, meta),
  error: (message: string, meta?: unknown) => emit('error', message, meta),
};
