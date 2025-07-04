import express from 'express';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get available rooms
router.get('/rooms', (req, res) => {
  // In a real implementation, this would query the GameManager
  // For now, return mock data
  res.json({
    rooms: [
      {
        id: 'DEMO01',
        name: 'Tutorial Island',
        players: 3,
        maxPlayers: 8,
        boardType: 'tutorial',
        state: 'waiting_for_players'
      },
      {
        id: 'DEMO02',
        name: 'Jungle Adventure',
        players: 5,
        maxPlayers: 8,
        boardType: 'jungle',
        state: 'in_progress'
      }
    ]
  });
});

// Get room details
router.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  // Mock room details
  res.json({
    room: {
      id: roomId,
      name: 'Demo Room',
      players: 4,
      maxPlayers: 8,
      boardType: 'standard',
      state: 'in_progress',
      createdAt: Date.now() - 300000 // 5 minutes ago
    }
  });
});

// Get player stats (protected route)
router.get('/stats', requireAuth, (req, res) => {
  res.json({
    stats: req.user.stats,
    achievements: [],
    recentGames: []
  });
});

// Get shop items
router.get('/shop', (req, res) => {
  res.json({
    items: [
      {
        id: 'energy_refill',
        name: 'Energy Refill',
        description: 'Instantly refill all energy',
        cost: { gems: 5 },
        type: 'consumable'
      },
      {
        id: 'double_dice',
        name: 'Double Dice',
        description: 'Roll two dice on your next turn',
        cost: { coins: 50 },
        type: 'consumable'
      },
      {
        id: 'coin_magnet',
        name: 'Coin Magnet',
        description: 'Double coins from blue spaces for 3 turns',
        cost: { gems: 10 },
        type: 'powerup'
      }
    ]
  });
});

// Purchase item (protected route)
router.post('/shop/purchase', requireAuth, (req, res) => {
  const { itemId } = req.body;
  
  // In a real implementation, this would:
  // 1. Validate the item exists
  // 2. Check if player has enough currency
  // 3. Deduct currency and add item to inventory
  // 4. Update the database
  
  res.json({
    success: true,
    item: {
      id: itemId,
      name: 'Energy Refill',
      quantity: 1
    },
    newBalance: {
      coins: req.user.stats.totalCoins - 50,
      gems: 0
    }
  });
});

// Get daily challenges
router.get('/challenges', (req, res) => {
  res.json({
    challenges: [
      {
        id: 'daily_1',
        name: 'First Steps',
        description: 'Play 3 games today',
        progress: 1,
        target: 3,
        reward: { coins: 50 },
        expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 hours
      },
      {
        id: 'daily_2',
        name: 'Minigame Master',
        description: 'Win 5 minigames',
        progress: 2,
        target: 5,
        reward: { gems: 2 },
        expiresAt: Date.now() + (12 * 60 * 60 * 1000)
      },
      {
        id: 'daily_3',
        name: 'Coin Collector',
        description: 'Collect 100 coins',
        progress: 45,
        target: 100,
        reward: { energy: 3 },
        expiresAt: Date.now() + (12 * 60 * 60 * 1000)
      }
    ]
  });
});

// Report bug or feedback
router.post('/feedback', (req, res) => {
  const { type, message, userAgent } = req.body;
  
  console.log('Feedback received:', {
    type,
    message,
    userAgent,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Thank you for your feedback!' });
});

export default router;