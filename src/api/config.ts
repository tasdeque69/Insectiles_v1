export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  SCORES: {
    SUBMIT: '/scores',
    GET_TOP: '/scores/top',
    GET_USER: '/scores/user',
  },
  LEADERBOARD: {
    GET: '/leaderboard',
    GET_BY_PERIOD: '/leaderboard/period',
  },
  PROGRESS: {
    GET: '/progress',
    SYNC: '/progress/sync',
  },
  ACHIEVEMENTS: {
    GET: '/achievements',
    UNLOCK: '/achievements/unlock',
  },
  CHALLENGES: {
    DAILY: '/challenges/daily',
    ACTIVE: '/challenges/active',
    COMPLETE: '/challenges/complete',
  },
} as const;

export type ApiEndpoint = typeof ENDPOINTS;
