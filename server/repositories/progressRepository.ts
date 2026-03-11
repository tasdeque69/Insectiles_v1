import { query } from '../db/pool.js';

interface Progress {
  id: number;
  user_id: number;
  high_score: number;
  total_plays: number;
  unlocked_insects: string[];
  created_at: Date;
  updated_at: Date;
}

export async function getOrCreateProgress(userId: number): Promise<Progress> {
  let result = await query('SELECT * FROM progress WHERE user_id = $1', [userId]);
  
  if (result.rows.length === 0) {
    result = await query(
      'INSERT INTO progress (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
  }
  
  return result.rows[0];
}

export async function updateProgress(
  userId: number,
  updates: {
    highScore?: number;
    totalPlays?: number;
    unlockedInsects?: string[];
  }
): Promise<Progress> {
  const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.highScore !== undefined) {
    setClauses.push(`high_score = GREATEST(high_score, $${paramIndex})`);
    params.push(updates.highScore);
    paramIndex++;
  }

  if (updates.totalPlays !== undefined) {
    setClauses.push(`total_plays = total_plays + $${paramIndex}`);
    params.push(updates.totalPlays);
    paramIndex++;
  }

  if (updates.unlockedInsects !== undefined) {
    setClauses.push(`unlocked_insects = ARRAY(SELECT DISTINCT unnest(unlocked_insects) FROM UNNEST($${paramIndex}::text[]) WITH ORDINALITY AS t(val, ord) ORDER BY t.ord))`);
    params.push(updates.unlockedInsects);
    paramIndex++;
  }

  params.push(userId);

  const result = await query(
    `UPDATE progress SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    params
  );

  return result.rows[0];
}

export async function incrementTotalPlays(userId: number): Promise<void> {
  await query(
    'UPDATE progress SET total_plays = total_plays + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [userId]
  );
}

export async function updateHighScore(userId: number, score: number): Promise<void> {
  await query(
    'UPDATE progress SET high_score = GREATEST(high_score, $1), updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [score, userId]
  );
}
