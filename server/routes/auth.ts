import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

const router = Router();

interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

// In-memory storage (replace with database in production)
// WARNING: This implementation is for development/demo purposes only.
// All user data will be lost when the server restarts.
// In production, use a persistent database (PostgreSQL, MongoDB, etc.)
if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: In-memory user storage is not suitable for production use. Configure a database connection.');
}
const users: Map<string, User> = new Map();

router.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  
  const id = `usr_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 12);
  
  const user: User = {
    id,
    email,
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  
  users.set(id, user);
  
  const token = generateToken(id, username);
  
  res.status(201).json({
    success: true,
    user: { id, email, username, createdAt: user.createdAt },
    token,
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  const user = Array.from(users.values()).find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = generateToken(user.id, user.username);
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
    token,
  });
});

export default router;
