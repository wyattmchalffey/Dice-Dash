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
        console.log('Attempting to connect to server...');
        
        // Connect to server
        this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('Connected to server with ID:', this.socket.id);
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
          this.connected = false;
          this.emitLocal('disconnected', { reason });
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
          this.emitLocal('reconnected', { attempts: attemptNumber });
        });

        // Set up event listeners for game events
        this.setupGameEventListeners();

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('Socket connection error:', error);
        reject(error);
      }
    });
  }

  setupGameEventListeners() {
    if (!this.socket) return;

    console.log('Setting up game event listeners...');

    // Game events
    this.socket.on(SOCKET_EVENTS.GAME_JOINED, (data) => {
      console.log('Game joined event:', data);
      this.emitLocal(SOCKET_EVENTS.GAME_JOINED, data);
    });

    this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data) => {
      console.log('Game state update:', data);
      this.emitLocal(SOCKET_EVENTS.GAME_STATE_UPDATE, data);
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      console.log('Player joined event:', data);
      this.emitLocal(SOCKET_EVENTS.PLAYER_JOINED, data);
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      console.log('Player left event:', data);
      this.emitLocal(SOCKET_EVENTS.PLAYER_LEFT, data);
    });

    // Turn events
    this.socket.on(SOCKET_EVENTS.DICE_ROLLED, (data) => {
      console.log('Dice rolled event received:', data);
      this.emitLocal(SOCKET_EVENTS.DICE_ROLLED, data);
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_MOVING, (data) => {
      console.log('Player moving event:', data);
      this.emitLocal(SOCKET_EVENTS.PLAYER_MOVING, data);
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_MOVED, (data) => {
      console.log('Player moved event:', data);
      this.emitLocal(SOCKET_EVENTS.PLAYER_MOVED, data);
    });

    this.socket.on(SOCKET_EVENTS.SPACE_ACTION, (data) => {
      console.log('Space action event:', data);
      this.emitLocal(SOCKET_EVENTS.SPACE_ACTION, data);
    });

    this.socket.on(SOCKET_EVENTS.NEXT_TURN, (data) => {
      console.log('Next turn event:', data);
      this.emitLocal(SOCKET_EVENTS.NEXT_TURN, data);
    });

    // Energy and currency events
    this.socket.on(SOCKET_EVENTS.ENERGY_UPDATED, (data) => {
      console.log('Energy updated event:', data);
      this.emitLocal(SOCKET_EVENTS.ENERGY_UPDATED, data);
    });

    this.socket.on(SOCKET_EVENTS.COINS_UPDATED, (data) => {
      console.log('Coins updated event:', data);
      this.emitLocal(SOCKET_EVENTS.COINS_UPDATED, data);
    });

    // Chat events
    this.socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
      console.log('Chat message event:', data);
      this.emitLocal(SOCKET_EVENTS.CHAT_MESSAGE, data);
    });

    this.socket.on(SOCKET_EVENTS.EMOTE_SENT, (data) => {
      console.log('Emote sent event:', data);
      this.emitLocal(SOCKET_EVENTS.EMOTE_SENT, data);
    });

    // Error events
    this.socket.on(SOCKET_EVENTS.ERROR, (data) => {
      console.error('Server error:', data);
      this.emitLocal(SOCKET_EVENTS.ERROR, data);
    });

    this.socket.on(SOCKET_EVENTS.INVALID_ACTION, (data) => {
      console.warn('Invalid action:', data);
      this.emitLocal(SOCKET_EVENTS.INVALID_ACTION, data);
    });

    this.socket.on(SOCKET_EVENTS.NOT_YOUR_TURN, (data) => {
      console.warn('Not your turn:', data);
      this.emitLocal(SOCKET_EVENTS.NOT_YOUR_TURN, data);
    });

    this.socket.on(SOCKET_EVENTS.INSUFFICIENT_ENERGY, (data) => {
      console.warn('Insufficient energy:', data);
      this.emitLocal(SOCKET_EVENTS.INSUFFICIENT_ENERGY, data);
    });
  }

  // Join a game room
  joinGame(playerName, roomId = null) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      console.log('Joining game with playerName:', playerName, 'roomId:', roomId);

      // Set up one-time listeners for join response
      const timeout = setTimeout(() => {
        this.socket.off(SOCKET_EVENTS.GAME_JOINED);
        this.socket.off(SOCKET_EVENTS.ERROR);
        reject(new Error('Join game timeout'));
      }, 10000);

      this.socket.once(SOCKET_EVENTS.GAME_JOINED, (data) => {
        clearTimeout(timeout);
        console.log('Successfully joined game:', data);
        resolve(data);
      });

      this.socket.once(SOCKET_EVENTS.ERROR, (error) => {
        clearTimeout(timeout);
        console.error('Failed to join game:', error);
        reject(new Error(error.message || 'Failed to join game'));
      });

      // Send join request
      this.socket.emit(SOCKET_EVENTS.JOIN_GAME, {
        playerName: playerName,
        roomId: roomId
      });
    });
  }

  // Check if event should be sent to server
  isServerEvent(event) {
    const serverEvents = [
      SOCKET_EVENTS.JOIN_GAME,
      SOCKET_EVENTS.LEAVE_GAME,
      SOCKET_EVENTS.REQUEST_ROLL,
      SOCKET_EVENTS.MINIGAME_RESULT,
      SOCKET_EVENTS.CHAT_MESSAGE,
      SOCKET_EVENTS.EMOTE_SENT,
      SOCKET_EVENTS.USE_ITEM,
      SOCKET_EVENTS.PURCHASE_ENERGY
    ];
    return serverEvents.includes(event);
  }

  // Send game action to server
  emitToServer(event, data = {}) {
    if (this.socket && this.connected) {
      console.log('Emitting to server:', event, data);
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event - not connected:', event);
    }
  }

  // Add event listener for local events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    console.log('Added listener for event:', event);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      console.log('Removed listener for event:', event);
    }
  }

  // Emit event to local listeners
  emitLocal(event, data) {
    console.log('Emitting local event:', event, data);
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

  // Public method to emit events (for backwards compatibility)
  emit(event, data = {}) {
    // If it's a server event, send to server
    if (this.isServerEvent(event)) {
      this.emitToServer(event, data);
    } else {
      // Otherwise emit locally
      this.emitLocal(event, data);
    }
  }

  // Request dice roll
  requestRoll() {
    console.log('Requesting dice roll...');
    this.emitToServer(SOCKET_EVENTS.REQUEST_ROLL);
  }

  // Submit minigame result
  submitMinigameResult(result) {
    console.log('Submitting minigame result:', result);
    this.emitToServer(SOCKET_EVENTS.MINIGAME_RESULT, result);
  }

  // Send chat message
  sendChatMessage(message) {
    console.log('Sending chat message:', message);
    this.emitToServer(SOCKET_EVENTS.CHAT_MESSAGE, { message });
  }

  // Send emote
  sendEmote(emoteId) {
    console.log('Sending emote:', emoteId);
    this.emitToServer(SOCKET_EVENTS.EMOTE_SENT, { emoteId });
  }

  // Leave current game
  leaveGame() {
    console.log('Leaving game...');
    this.emitToServer(SOCKET_EVENTS.LEAVE_GAME);
  }

  // Disconnect from server
  disconnect() {
    console.log('Disconnecting from server...');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  // Get socket ID
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Get current room
  getCurrentRoom() {
    return this.socket ? this.socket.room : null;
  }

  // Debug method to log current state
  getDebugInfo() {
    return {
      connected: this.connected,
      socketId: this.getSocketId(),
      listenersCount: this.listeners.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}