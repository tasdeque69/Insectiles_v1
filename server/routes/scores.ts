import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';

const router = Router();

interface Score {
  id: string;
  userId: string;
  username: string;
  score: number;
  duration: number;
  insectsMatched: number;
  maxCombo: number;
  feverTriggers: number;
  timestamp: string;
}

const scores: Score[] = [];

// All score routes require authentication
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { score, duration, insectsMatched, maxCombo, feverTriggers } = req.body;
  const userId = req.userId!;
  const username = req.username || 'Player';
  
  if (!score || score < 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }
  
  const newScore: Score = {
    id: `scr_${Date.now()}`,
    userId,
    username,
    score,
    duration: duration || 0,
    insectsMatched: insectsMatched || 0,
    maxCombo: maxCombo || 0,
    feverTriggers: feverTriggers || 0,
    timestamp: new Date().toISOString(),
  };
  
  scores.push(newScore);
  
  const userScores = scores.filter(s => s.userId === userId);
  const personalBest = Math.max(...userScores.map(s => s.score));
  const rank = scores.filter(s => s.score > score).length + 1;
  
  res.status(201).json({
    success: true,
    score: newScore,
    rank,
    personalBest: personalBest === score,
  });
});

router.get('/user', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  
  const userScores = scores
    .filter(s => s.userId === userId)
    .sort((a, b) => b.score - a.score);
  
  res.json({
    scores: userScores.slice(0, 10),
    total: userScores.length,
    personalBest: userScores.length > 0 ? Math.max(...userScores.map(s => s.score)) : 0,
  });
});

export default router;
