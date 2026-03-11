import { Router, Request, Response } from 'express';

const router = Router();

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  timestamp: string;
}

const scores: LeaderboardEntry[] = [];

router.get('/', (req: Request, res: Response) => {
  const type = req.query.type || 'all';
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const offset = parseInt(req.query.offset as string) || 0;
  
  let filteredScores = [...scores];
  
  if (type === 'daily') {
    const today = new Date().toISOString().split('T')[0];
    filteredScores = scores.filter(s => s.timestamp.startsWith(today));
  } else if (type === 'weekly') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    filteredScores = scores.filter(s => new Date(s.timestamp) >= weekAgo);
  }
  
  filteredScores.sort((a, b) => b.score - a.score);
  
  const leaderboard = filteredScores
    .slice(offset, offset + limit)
    .map((entry, index) => ({
      rank: offset + index + 1,
      username: entry.username,
      score: entry.score,
      timestamp: entry.timestamp,
    }));
  
  res.json({
    leaderboard,
    total: filteredScores.length,
    hasMore: offset + limit < filteredScores.length,
  });
});

export default router;
