export const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  duration INTEGER DEFAULT 0,
  insects_matched INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  fever_triggers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  high_score INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  unlocked_insects TEXT[] DEFAULT ARRAY['weed_ant'],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard cache table
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id SERIAL PRIMARY KEY,
  leaderboard_type VARCHAR(20) NOT NULL,
  data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(leaderboard_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created ON scores(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
`;

export const dropSchema = `
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS leaderboard_cache CASCADE;
`;
