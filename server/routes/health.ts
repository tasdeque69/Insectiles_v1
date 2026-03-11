import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

export default router;
