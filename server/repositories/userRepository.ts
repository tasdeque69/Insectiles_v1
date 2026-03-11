import { query } from '../db/pool.js';

interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(email: string, username: string, passwordHash: string): Promise<User> {
  const result = await query(
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [email, username, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await query('SELECT id, email, username, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
}

export async function updateUserPassword(userId: number, newHash: string): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newHash, userId]
  );
}
