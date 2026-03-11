import { Router, Request, Response } from 'express';

const router = Router();

interface UserProgress {
  userId: string;
  highScore: number;
  totalPlays: number;
  achievements: string[];
  unlockedInsects: string[];
  statistics: {
    totalInsectsMatched: number;
    totalPlayTime: number;
  };
}

const progress: Map<string, UserProgress> = new Map();

router.get('/', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const userProgress = progress.get(userId) || {
    userId,
    highScore: 0,
    totalPlays: 0,
    achievements: [],
    unlockedInsects: ['weed_ant'],
    statistics: {
      totalInsectsMatched: 0,
      totalPlayTime: 0,
    },
  };
  
  res.json(userProgress);
});

router.post('/sync', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { highScore, achievements, unlockedInsects } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const existing = progress.get(userId) || {
    userId,
    highScore: 0,
    totalPlays: 0,
    achievements: [],
    unlockedInsects: ['weed_ant'],
    statistics: {
      totalInsectsMatched: 0,
      totalPlayTime: 0,
    },
  };
  
  if (highScore && highScore > existing.highScore) {
    existing.highScore = highScore;
  }
  
  if (achievements) {
    const newAchievements = achievements.filter((a: string) => !existing.achievements.includes(a));
    existing.achievements = [...existing.achievements, ...newAchievements];
  }
  
  if (unlockedInsects) {
    const newInsects = unlockedInsects.filter((i: string) => !existing.unlockedInsects.includes(i));
    existing.unlockedInsects = [...existing.unlockedInsects, ...newInsects];
  }
  
  existing.totalPlays++;
  
  progress.set(userId, existing);
  
  res.json({ success: true, progress: existing });
});

export default router;
