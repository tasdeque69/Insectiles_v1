import { query } from '../db/pool.js';

interface Score {
  id: number;
  user_id: number;
  username: string;
  score: number;
  duration: number;
  insects_matched: number;
  max_combo: number;
  fever_triggers: number;
  created_at: Date;
}

interface ScoreInput {
  userId: number;
  username: string;
  score: number;
  duration?: number;
  insectsMatched?: number;
  maxCombo?: number;
  feverTriggers?: number;
}

export async function createScore(input: ScoreInput): Promise<Score> {
  const result = await query(
    `INSERT INTO scores (user_id, username, score, duration, insects_matched, max_combo, fever_triggers) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      input.userId,
      input.username,
      input.score,
      input.duration || 0,
      input.insectsMatched || 0,
      input.maxCombo || 0,
      input.feverTriggers || 0,
    ]
  );
  return result.rows[0];
}

export async function getUserScores(userId: number, limit = 10): Promise<Score[]> {
  const result = await query(
    'SELECT * FROM scores WHERE user_id = $1 ORDER BY score DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
}

export async function getUserHighScore(userId: number): Promise<number> {
  const result = await query(
    'SELECT MAX(score) as high_score FROM scores WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.high_score || 0;
}

export async function getGlobalLeaderboard(type = 'all', limit = 100, offset = 0): Promise<Score[]> {
  let queryText = 'SELECT * FROM scores';
  const params: unknown[] = [];

  if (type === 'daily') {
    queryText += ' WHERE created_at >= CURRENT_DATE';
  } else if (type === 'weekly') {
    queryText += ' WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
  }

  queryText += ' ORDER BY score DESC LIMIT $1 OFFSET $2';
  params.push(limit, offset);

  const result = await query(queryText, params);
  return result.rows;
}

export async function getRankForScore(score: number): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) + 1 as rank FROM scores WHERE score > $1',
    [score]
  );
  return parseInt(result.rows[0].rank);
}

export async function getTotalScores(): Promise<number> {
  const result = await query('SELECT COUNT(*) as total FROM scores');
  return parseInt(result.rows[0].total);
}
