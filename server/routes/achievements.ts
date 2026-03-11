import { Router, Request, Response } from 'express';

const router = Router();

interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;
  condition: {
    type: string;
    value: number;
  };
}

const achievements: Achievement[] = [
  { id: 'first_tap', name: 'First Tap', description: 'Score your first point', reward: 10, condition: { type: 'score', value: 1 } },
  { id: 'combo_5', name: 'Combo 5', description: 'Get a 5x combo', reward: 50, condition: { type: 'combo', value: 5 } },
  { id: 'combo_10', name: 'Combo Master', description: 'Get a 10x combo', reward: 100, condition: { type: 'combo', value: 10 } },
  { id: 'score_100', name: 'Century', description: 'Score 100 points', reward: 25, condition: { type: 'score', value: 100 } },
  { id: 'score_500', name: 'High Scorer', description: 'Score 500 points', reward: 50, condition: { type: 'score', value: 500 } },
  { id: 'score_1000', name: 'Thousand Club', description: 'Score 1000 points', reward: 100, condition: { type: 'score', value: 1000 } },
  { id: 'fever_5', name: 'Fever Rush', description: 'Trigger fever mode 5 times', reward: 75, condition: { type: 'fever', value: 5 } },
  { id: 'play_10', name: 'Getting Started', description: 'Play 10 games', reward: 20, condition: { type: 'plays', value: 10 } },
  { id: 'play_50', name: 'Regular', description: 'Play 50 games', reward: 50, condition: { type: 'plays', value: 50 } },
  { id: 'play_100', name: 'Dedicated', description: 'Play 100 games', reward: 100, condition: { type: 'plays', value: 100 } },
];

const userAchievements: Map<string, string[]> = new Map();

router.get('/', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const unlocked = userId ? (userAchievements.get(userId) || []) : [];
  
  const result = achievements.map(a => ({
    ...a,
    unlocked: unlocked.includes(a.id),
  }));
  
  res.json({ achievements: result });
});

router.post('/unlock', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { achievementId } = req.body;
  
  if (!userId || !achievementId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }
  
  const userUnlocked = userAchievements.get(userId) || [];
  
  if (userUnlocked.includes(achievementId)) {
    return res.json({ success: true, unlocked: false, achievement });
  }
  
  userUnlocked.push(achievementId);
  userAchievements.set(userId, userUnlocked);
  
  res.json({ success: true, unlocked: true, achievement });
});

export default router;
