import { GameRoom } from './GameRoom.js';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_EVENTS } from '../../../shared/constants/Events.js';
import { Validators } from '../../../shared/utils/Validators.js';

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> GameRoom
    this.playerRooms = new Map(); // socketId -> roomId
    this.playerData = new Map(); // socketId -> playerData
  }

  // Generate a unique room ID
  generateRoomId() {
    let roomId;
    do {
      roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(roomId));
    return roomId;
  }

  // Handle player joining a game
  async handlePlayerJoin(socket, playerName, requestedRoomId = null) {
    // Validate player name
    if (!Validators.isValidPlayerName(playerName)) {
      throw new Error('Invalid player name');
    }

    // Check if player is already in a room
    if (this.playerRooms.has(socket.id)) {
      throw new Error('Already in a game');
    }

    let roomId = requestedRoomId;
    let room;

    // Create or join room
    if (!roomId) {
      // Find an available room or create new one
      room = this.findAvailableRoom();
      if (!room) {
        roomId = this.generateRoomId();
        room = new GameRoom(roomId, this.io);
        this.rooms.set(roomId, room);
        console.log(`Created new room: ${roomId}`);
      } else {
        roomId = room.id;
      }
    } else {
      // Join specific room
      if (!Validators.isValidRoomId(roomId)) {
        throw new Error('Invalid room ID');
      }
      room = this.rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      if (room.isFull()) {
        throw new Error('Room is full');
      }
    }

    // Create player data
    const playerId = uuidv4();
    const playerData = {
      id: playerId,
      socketId: socket.id,
      name: Validators.sanitizePlayerName(playerName),
      roomId: roomId
    };

    // Add player to room
    const player = room.addPlayer(playerData, socket);
    
    // Store player associations
    this.playerRooms.set(socket.id, roomId);
    this.playerData.set(socket.id, playerData);

    // Join socket room
    socket.join(roomId);

    // Return game state
    return {
      playerId: playerId,
      roomId: roomId,
      gameState: room.getGameState(),
      player: player.getPublicData()
    };
  }

  // Find an available room
  findAvailableRoom() {
    for (const [roomId, room] of this.rooms) {
      if (!room.isFull() && room.isWaitingForPlayers()) {
        return room;
      }
    }
    return null;
  }

  // Handle dice roll request
  async handleRollDice(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) {
      throw new Error('Not in a game');
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const playerData = this.playerData.get(socketId);
    await room.handleRollDice(playerData.id);
  }

  // Handle minigame result
  async handleMinigameResult(socketId, result) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) {
      throw new Error('Not in a game');
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const playerData = this.playerData.get(socketId);
    await room.handleMinigameResult(playerData.id, result);
  }

  // Handle player disconnect
  handlePlayerDisconnect(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerData = this.playerData.get(socketId);
    if (playerData) {
      room.removePlayer(playerData.id);
    }

    // Clean up player data
    this.playerRooms.delete(socketId);
    this.playerData.delete(socketId);

    // Remove empty rooms
    if (room.isEmpty()) {
      console.log(`Removing empty room: ${roomId}`);
      this.rooms.delete(roomId);
    }
  }

  // Handle chat message
  handleChatMessage(socketId, message) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerData = this.playerData.get(socketId);
    room.handleChatMessage(playerData.id, message);
  }

  // Handle emote
  handleEmote(socketId, emote) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerData = this.playerData.get(socketId);
    room.handleEmote(playerData.id, emote);
  }

  // Get room statistics
  getRoomStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalPlayers: this.playerRooms.size,
      roomDetails: []
    };

    for (const [roomId, room] of this.rooms) {
      stats.roomDetails.push({
        roomId: roomId,
        playerCount: room.players.size,
        state: room.state,
        created: room.createdAt
      });
    }

    return stats;
  }
}