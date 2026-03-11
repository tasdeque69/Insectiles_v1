import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';
import leaderboardRoutes from './routes/leaderboard.js';
import progressRoutes from './routes/progress.js';
import achievementsRoutes from './routes/achievements.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

// Security: Validate CORS origin
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    // In production, you should set ALLOWED_ORIGIN to a specific domain
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS policy: origin required in production'), false);
      }
      return callback(null, true);
    }
    // Check if origin is allowed
    if (ALLOWED_ORIGIN && (origin === ALLOWED_ORIGIN || origin === `https://${ALLOWED_ORIGIN}`)) {
      return callback(null, true);
    }
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(requestLogger);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Insectiles API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎮 Insectiles API server running on port ${PORT}`);
});

export default app;
