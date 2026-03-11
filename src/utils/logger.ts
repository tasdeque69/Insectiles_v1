export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private minLevel: LogLevel = 'info';
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private addLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${level.toUpperCase()}]`;
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logFn(prefix, message, context || '');
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.addLog('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.addLog('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.addLog('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.addLog('error', message, context);
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }
    return filtered.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger(import.meta.env.DEV ? 'debug' : 'info');

export default logger;
