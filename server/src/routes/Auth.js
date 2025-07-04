import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Validators } from '../../../shared/utils/Validators.js';

const router = express.Router();

// Temporary in-memory storage for demo
// In production, use a proper database
const users = new Map();
const sessions = new Map();

// Register/Login endpoint (simplified for demo)
router.post('/login', (req, res) => {
  const { playerName } = req.body;
  
  // Validate player name
  if (!Validators.isValidPlayerName(playerName)) {
    return res.status(400).json({
      error: 'Invalid player name. Must be 3-20 characters long and contain only letters, numbers, spaces, underscores, and hyphens.'
    });
  }
  
  const sanitizedName = Validators.sanitizePlayerName(playerName);
  
  // Create or retrieve user
  let userId;
  let user;
  
  // Check if user exists
  for (const [id, u] of users) {
    if (u.name === sanitizedName) {
      userId = id;
      user = u;
      break;
    }
  }
  
  // Create new user if doesn't exist
  if (!user) {
    userId = uuidv4();
    user = {
      id: userId,
      name: sanitizedName,
      createdAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalCoins: 0,
        totalStars: 0
      }
    };
    users.set(userId, user);
  }
  
  // Create session
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    userId: userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  sessions.set(sessionId, session);
  
  // Return user data and session
  res.json({
    user: {
      id: user.id,
      name: user.name,
      stats: user.stats
    },
    sessionId: sessionId
  });
});

// Validate session endpoint
router.get('/validate', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'No session ID provided' });
  }
  
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  const user = users.get(session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    valid: true,
    user: {
      id: user.id,
      name: user.name,
      stats: user.stats
    }
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId) {
    sessions.delete(sessionId);
  }
  
  res.json({ success: true });
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  const leaderboard = Array.from(users.values())
    .sort((a, b) => b.stats.totalCoins - a.stats.totalCoins)
    .slice(0, 100)
    .map((user, index) => ({
      rank: index + 1,
      name: user.name,
      totalCoins: user.stats.totalCoins,
      gamesWon: user.stats.gamesWon,
      totalStars: user.stats.totalStars
    }));
  
  res.json({ leaderboard });
});

// Middleware to validate session for protected routes
export function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  const user = users.get(session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Attach user to request
  req.user = user;
  next();
}

export default router;