import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  method: string;
  url: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
}

const logs: LogEntry[] = [];

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const entry: LogEntry = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    logs.push(entry);
    
    if (logs.length > 1000) {
      logs.shift();
    }
    
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(
      `${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.url} - ${duration}ms`
    );
  });
  
  next();
}

export function getLogs(limit: number = 100): LogEntry[] {
  return logs.slice(-limit);
}

export function clearLogs(): void {
  logs.length = 0;
}
