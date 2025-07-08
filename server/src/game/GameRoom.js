import { BoardState } from './BoardState.js';
import { TurnManager } from './TurnManager.js';
import { Player } from '../models/Player.js';
import { GAME_CONFIG, GAME_STATES } from '../../../shared/constants/GameConstants.js';
import { SOCKET_EVENTS } from '../../../shared/constants/Events.js';
import { rollDice, calculateSpaceAction } from '../../../shared/utils/GameLogic.js';
import { Validators } from '../../../shared/utils/Validators.js';

export class GameRoom {
  constructor(id, io) {
    this.id = id;
    this.io = io;
    this.players = new Map(); // playerId -> Player
    this.sockets = new Map(); // playerId -> socket
    this.boardState = new BoardState();
    this.turnManager = new TurnManager();
    this.state = GAME_STATES.WAITING_FOR_PLAYERS;
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
    
    // Start energy regeneration timer
    this.startEnergyRegeneration();
  }

  // Add a player to the room
  addPlayer(playerData, socket) {
    const player = new Player(
      playerData.id,
      playerData.name,
      this.boardState.getStartPosition()
    );
    
    this.players.set(player.id, player);
    this.sockets.set(player.id, socket);
    
    // Notify all players
    this.broadcast(SOCKET_EVENTS.PLAYER_JOINED, {
      player: player.getPublicData(),
      totalPlayers: this.players.size
    });
    
    // Start game if enough players
    if (this.players.size >= GAME_CONFIG.MIN_PLAYERS_TO_START && 
        this.state === GAME_STATES.WAITING_FOR_PLAYERS) {
      this.startGame();
    }
    
    this.updateActivity();
    return player;
  }

  // Remove a player from the room
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    player.setDisconnected();
    this.sockets.delete(playerId);
    
    // Notify other players
    this.broadcast(SOCKET_EVENTS.PLAYER_LEFT, {
      playerId: playerId,
      playerName: player.name
    });
    
    // Handle turn change if it was this player's turn
    if (this.turnManager.isCurrentPlayer(playerId)) {
      this.nextTurn();
    }
    
    this.updateActivity();
  }

    // Update startGame method to not initialize turns:
    startGame() {
        this.state = GAME_STATES.IN_PROGRESS;
        this.broadcast(SOCKET_EVENTS.GAME_STATE_UPDATE, {
            state: this.state
        });

        console.log(`Game started in room ${this.id} with ${this.players.size} players`);
    }

  // Handle dice roll
  async handleRollDice(playerId) {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Player not found');
    
    // REMOVED: Turn validation
    // Now any player can roll as long as they have energy
    
    // Check energy
    if (!player.hasEnergy(GAME_CONFIG.ENERGY_COST_PER_TURN)) {
      throw new Error('Insufficient energy');
    }
    
    // Use energy
    player.useEnergy(GAME_CONFIG.ENERGY_COST_PER_TURN);

    // Broadcast energy update immediately after using energy
    this.broadcast(SOCKET_EVENTS.ENERGY_UPDATED, {
        playerId: playerId,
        currentEnergy: player.energy,
        maxEnergy: GAME_CONFIG.MAX_ENERGY
    });

    // Roll dice
    const diceResult = rollDice();
    
    // Broadcast dice roll
    this.broadcast(SOCKET_EVENTS.DICE_ROLLED, {
      playerId: playerId,
      playerName: player.name,
      diceResult: diceResult
    });
    
    // Move player
    await this.movePlayer(playerId, diceResult.total);
    
    this.updateActivity();
  }

  // Move player on board
  async movePlayer(playerId, spaces) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    const oldPosition = player.position;
    const newPosition = this.boardState.calculateNewPosition(oldPosition, spaces);
    
    // Update player position
    player.setPosition(newPosition);
    
    // Broadcast movement
    this.broadcast(SOCKET_EVENTS.PLAYER_MOVING, {
      playerId: playerId,
      from: oldPosition,
      to: newPosition,
      spaces: spaces
    });
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, spaces * GAME_CONFIG.MOVE_ANIMATION_DURATION));
    
    // Execute space action
    await this.executeSpaceAction(playerId, newPosition);
  }

  // Execute action for the space the player landed on
  async executeSpaceAction(playerId, position) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    const space = this.boardState.getSpace(position);
    const result = calculateSpaceAction(space.type, player);
    
    // Apply effects
    if (result.coins) player.addCoins(result.coins);
    if (result.energy) player.addEnergy(result.energy);
    
    // Broadcast space action
    this.broadcast(SOCKET_EVENTS.SPACE_ACTION, {
      playerId: playerId,
      spaceType: space.type,
      result: result
    });
    
    // Handle special actions
    if (result.action === 'start_minigame') {
      await this.startMinigame(playerId);
    } else if (result.action === 'warp') {
      // TODO: Implement warp logic
      this.nextTurn();
    } else {
      // End turn
      this.nextTurn();
    }
  }

  // Start a minigame
  async startMinigame(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    player.setState('in_minigame');
    
    // Select random minigame
    const minigames = ['memory_match', 'fruit_slash', 'quick_tap'];
    const selectedMinigame = minigames[Math.floor(Math.random() * minigames.length)];
    
    // Notify player to start minigame
    const socket = this.sockets.get(playerId);
    if (socket) {
      socket.emit(SOCKET_EVENTS.MINIGAME_START, {
        type: selectedMinigame,
        timeLimit: 30000 // 30 seconds
      });
    }
  }

  // Handle minigame result
  async handleMinigameResult(playerId, result) {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Player not found');
    
    // Validate result
    if (!result || typeof result.score !== 'number') {
      throw new Error('Invalid minigame result');
    }
    
    // Calculate reward
    let reward = 0;
    if (result.completed && result.score > 0) {
      reward = GAME_CONFIG.MINIGAME_WIN_REWARD;
    }
    
    // Apply reward
    player.addCoins(reward);
    player.setState('waiting');
    
    // Broadcast result
    this.broadcast(SOCKET_EVENTS.MINIGAME_ENDED, {
      playerId: playerId,
      playerName: player.name,
      score: result.score,
      reward: reward
    });
    
    // End turn
    this.nextTurn();
  }

  // Move to next turn
  nextTurn() {
    const nextPlayerId = this.turnManager.nextTurn();
    
    // Skip disconnected players
    let attempts = 0;
    while (attempts < this.players.size) {
      const player = this.players.get(nextPlayerId);
      if (player && !player.isDisconnected) {
        break;
      }
      nextPlayerId = this.turnManager.nextTurn();
      attempts++;
    }
    
    // Broadcast next turn
    this.broadcast(SOCKET_EVENTS.NEXT_TURN, {
      currentPlayer: nextPlayerId,
      turnNumber: this.turnManager.turnNumber
    });
    
    this.updateActivity();
  }

  // Handle chat message
  handleChatMessage(playerId, message) {
    if (!Validators.isValidChatMessage(message)) return;
    
    const player = this.players.get(playerId);
    if (!player) return;
    
    const sanitized = Validators.sanitizeChatMessage(message);
    
    this.broadcast(SOCKET_EVENTS.CHAT_MESSAGE, {
      playerId: playerId,
      playerName: player.name,
      message: sanitized,
      timestamp: Date.now()
    });
  }

  // Handle emote
  handleEmote(playerId, emoteId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    this.broadcast(SOCKET_EVENTS.EMOTE_SENT, {
      playerId: playerId,
      playerName: player.name,
      emoteId: emoteId,
      position: player.position
    });
  }

  // Start energy regeneration timer
  startEnergyRegeneration() {
    setInterval(() => {
      for (const [playerId, player] of this.players) {
        if (player.energy < GAME_CONFIG.MAX_ENERGY) {
          player.addEnergy(1);
          
          // Notify player of energy regen
          const socket = this.sockets.get(playerId);
          if (socket) {
            socket.emit(SOCKET_EVENTS.ENERGY_REGENERATED, {
              currentEnergy: player.energy,
              maxEnergy: GAME_CONFIG.MAX_ENERGY
            });
          }
        }
      }
    }, GAME_CONFIG.DEMO_MODE ? GAME_CONFIG.DEMO_ENERGY_REGEN_TIME : GAME_CONFIG.ENERGY_REGEN_TIME);
  }

  // Broadcast to all players in room
  broadcast(event, data) {
    this.io.to(this.id).emit(event, {
      roomId: this.id,
      ...data
    });
  }

  // Get current game state
  getGameState() {
    const players = [];
    for (const [id, player] of this.players) {
      players.push(player.getPublicData());
    }
    
    return {
      roomId: this.id,
      state: this.state,
      players: players,
      currentPlayer: this.turnManager.getCurrentPlayer(),
      turnNumber: this.turnManager.turnNumber,
      board: this.boardState.getBoardData()
    };
  }

  // Update last activity timestamp
  updateActivity() {
    this.lastActivityAt = Date.now();
  }

  // Check if room is full
  isFull() {
    return this.players.size >= GAME_CONFIG.MAX_PLAYERS_PER_BOARD;
  }

  // Check if room is empty
  isEmpty() {
    return this.players.size === 0;
  }

  // Check if waiting for players
  isWaitingForPlayers() {
    return this.state === GAME_STATES.WAITING_FOR_PLAYERS;
  }
}