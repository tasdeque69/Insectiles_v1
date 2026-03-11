import { query } from '../db/pool.js';

interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: string;
  unlocked_at: Date;
}

export async function getUserAchievements(userId: number): Promise<string[]> {
  const result = await query(
    'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
    [userId]
  );
  return result.rows.map((row) => row.achievement_id);
}

export async function unlockAchievement(userId: number, achievementId: string): Promise<boolean> {
  try {
    await query(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
      [userId, achievementId]
    );
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return false;
    }
    throw error;
  }
}

export async function hasAchievement(userId: number, achievementId: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
    [userId, achievementId]
  );
  return result.rows.length > 0;
}

export async function getAllAchievements(): Promise<Array<{ id: string; name: string; description: string; reward: number }>> {
  return [
    { id: 'first_tap', name: 'First Tap', description: 'Score your first point', reward: 10 },
    { id: 'combo_5', name: 'Combo 5', description: 'Get a 5x combo', reward: 50 },
    { id: 'combo_10', name: 'Combo Master', description: 'Get a 10x combo', reward: 100 },
    { id: 'score_100', name: 'Century', description: 'Score 100 points', reward: 25 },
    { id: 'score_500', name: 'High Scorer', description: 'Score 500 points', reward: 50 },
    { id: 'score_1000', name: 'Thousand Club', description: 'Score 1000 points', reward: 100 },
    { id: 'fever_5', name: 'Fever Rush', description: 'Trigger fever mode 5 times', reward: 75 },
    { id: 'play_10', name: 'Getting Started', description: 'Play 10 games', reward: 20 },
    { id: 'play_50', name: 'Regular', description: 'Play 50 games', reward: 50 },
    { id: 'play_100', name: 'Dedicated', description: 'Play 100 games', reward: 100 },
  ];
}
