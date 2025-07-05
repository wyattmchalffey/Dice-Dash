import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../shared/constants/Events';

export class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to server
        this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('Connected to server');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
          this.connected = false;
          this.emit('disconnected', { reason });
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to server'));
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('Reconnected after', attemptNumber, 'attempts');
          this.emit('reconnected', { attempts: attemptNumber });
        });

        // Set up event listeners for game events
        this.setupGameEventListeners();

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  setupGameEventListeners() {
    // Game events
    const gameEvents = [
      SOCKET_EVENTS.GAME_STATE_UPDATE,
      SOCKET_EVENTS.PLAYER_JOINED,
      SOCKET_EVENTS.PLAYER_LEFT,
      SOCKET_EVENTS.DICE_ROLLED,
      SOCKET_EVENTS.PLAYER_MOVING,
      SOCKET_EVENTS.PLAYER_MOVED,
      SOCKET_EVENTS.SPACE_ACTION,
      SOCKET_EVENTS.TURN_ENDED,
      SOCKET_EVENTS.NEXT_TURN,
      SOCKET_EVENTS.MINIGAME_START,
      SOCKET_EVENTS.MINIGAME_ENDED,
      SOCKET_EVENTS.ENERGY_UPDATED,
      SOCKET_EVENTS.ENERGY_REGENERATED,
      SOCKET_EVENTS.COINS_UPDATED,
      SOCKET_EVENTS.CHAT_MESSAGE,
      SOCKET_EVENTS.EMOTE_SENT,
      SOCKET_EVENTS.ERROR
    ];

    gameEvents.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  // Join a game room
  joinGame(playerName, roomId = null) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Send join request
      this.socket.emit(SOCKET_EVENTS.JOIN_GAME, {
        playerName,
        roomId
      });

      // Wait for response
      const timeout = setTimeout(() => {
        this.socket.off(SOCKET_EVENTS.GAME_JOINED);
        this.socket.off(SOCKET_EVENTS.ERROR);
        reject(new Error('Join game timeout'));
      }, 10000);

      this.socket.once(SOCKET_EVENTS.GAME_JOINED, (data) => {
        clearTimeout(timeout);
        this.socket.off(SOCKET_EVENTS.ERROR);
        resolve(data);
      });

      this.socket.once(SOCKET_EVENTS.ERROR, (error) => {
        clearTimeout(timeout);
        this.socket.off(SOCKET_EVENTS.GAME_JOINED);
        reject(new Error(error.message || 'Failed to join game'));
      });
    });
  }

  // Send game action
  emit(event, data = {}) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event - not connected:', event);
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Emit event to local listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', event, error);
        }
      });
    }
  }

  // Request dice roll
  requestRoll() {
    this.emit(SOCKET_EVENTS.REQUEST_ROLL);
  }

  // Submit minigame result
  submitMinigameResult(result) {
    this.emit(SOCKET_EVENTS.MINIGAME_RESULT, result);
  }

  // Send chat message
  sendChatMessage(message) {
    this.emit(SOCKET_EVENTS.CHAT_MESSAGE, { message });
  }

  // Send emote
  sendEmote(emoteId) {
    this.emit(SOCKET_EVENTS.EMOTE_SENT, { emoteId });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  isConnected() {
    return this.connected;
  }

  // Get socket ID
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}