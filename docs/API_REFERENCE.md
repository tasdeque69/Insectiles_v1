# API Reference

> **Version**: 1.0.0  
> **Status**: In Development

---

## Base URL

```
Production: https://api.insectiles.game
Development: http://localhost:3001/api
```

---

## Authentication

### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "player1"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "username": "player1",
    "createdAt": "2026-03-11T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/login

Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

---

## Scores

### POST /api/scores

Submit a game score.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "score": 1000,
  "duration": 120,
  "insectsMatched": 50,
  "maxCombo": 5,
  "feverTriggers": 3
}
```

**Response:**
```json
{
  "success": true,
  "rank": 42,
  "personalBest": false
}
```

### GET /api/leaderboard

Get global leaderboard.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | "all" | all, daily, weekly |
| limit | number | 100 | Max results |
| offset | number | 0 | Pagination |

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "player1",
      "score": 10000,
      "timestamp": "2026-03-11T00:00:00Z"
    }
  ],
  "total": 1000,
  "hasMore": true
}
```

---

## Progress

### GET /api/progress

Get user progress.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "highScore": 5000,
  "totalPlays": 100,
  "achievements": ["first_tap", "combo_10"],
  "unlockedInsects": ["weed_ant", "rainbow_ant"],
  "statistics": {
    "totalInsectsMatched": 5000,
    "totalPlayTime": 3600
  }
}
```

### POST /api/progress/sync

Sync progress across devices.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "highScore": 5000,
  "lastSync": "2026-03-10T00:00:00Z",
  "achievements": ["first_tap"]
}
```

---

## Achievements

### GET /api/achievements

Get all achievements.

**Response:**
```json
{
  "achievements": [
    {
      "id": "first_tap",
      "name": "First Tap",
      "description": "Score your first point",
      "reward": 10,
      "unlocked": true
    }
  ]
}
```

---

## Error Responses

All endpoints may return errors:

### 400 - Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid email format"
}
```

### 401 - Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 429 - Rate Limited
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests",
  "retryAfter": 60
}
```

### 500 - Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /api/auth/* | 5/minute |
| /api/scores | 10/minute |
| /api/progress | 30/minute |
| /api/leaderboard | 60/minute |

---

*Last Updated: March 2026*
