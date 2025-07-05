import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameManager } from './game/GameManager.js';
import { SOCKET_EVENTS } from '../../shared/constants/Events.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize game manager
const gameManager = new GameManager(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Join game
  socket.on(SOCKET_EVENTS.JOIN_GAME, async (data) => {
    try {
      const { playerName, roomId } = data;
      const result = await gameManager.handlePlayerJoin(socket, playerName, roomId);
      socket.emit(SOCKET_EVENTS.GAME_JOINED, result);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Handle roll dice request
  socket.on(SOCKET_EVENTS.REQUEST_ROLL, async (data) => {
    try {
      await gameManager.handleRollDice(socket.id);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Handle minigame result
  socket.on(SOCKET_EVENTS.MINIGAME_RESULT, async (data) => {
    try {
      await gameManager.handleMinigameResult(socket.id, data);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.handlePlayerDisconnect(socket.id);
  });
  
  // Handle chat message
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
    try {
      gameManager.handleChatMessage(socket.id, data);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Handle emote
  socket.on(SOCKET_EVENTS.EMOTE_SENT, (data) => {
    try {
      gameManager.handleEmote(socket.id, data);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

export { app, io };