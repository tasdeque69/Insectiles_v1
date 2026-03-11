import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

interface AnalyticsPayload {
  events: AnalyticsEvent[];
}

router.post('/', (req: Request<{}, {}, AnalyticsPayload>, res: Response) => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  for (const event of events) {
    if (!event.name || typeof event.timestamp !== 'number') {
      continue;
    }

    console.log(`[Analytics] ${event.name}`, event.properties || {});
  }

  res.status(204).send();
});

export default router;
