// Input validation utilities
export const Validators = {
  // Player name validation
  isValidPlayerName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 3 && trimmed.length <= 20 && /^[a-zA-Z0-9_\- ]+$/.test(trimmed);
  },

  // Room ID validation
  isValidRoomId(roomId) {
    if (!roomId || typeof roomId !== 'string') return false;
    return /^[A-Z0-9]{6}$/.test(roomId);
  },

  // Player ID validation (UUID)
  isValidPlayerId(playerId) {
    if (!playerId || typeof playerId !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId);
  },

  // Board position validation
  isValidPosition(position, boardSize) {
    return Number.isInteger(position) && position >= 0 && position < boardSize;
  },

  // Dice value validation
  isValidDiceRoll(value, minValue = 1, maxValue = 6) {
    return Number.isInteger(value) && value >= minValue && value <= maxValue;
  },

  // Currency validation
  isValidCurrency(amount) {
    return Number.isInteger(amount) && amount >= 0;
  },

  // Energy validation
  isValidEnergy(energy, maxEnergy = 5) {
    return Number.isInteger(energy) && energy >= 0 && energy <= maxEnergy;
  },

  // Action validation
  isValidAction(action, allowedActions) {
    return allowedActions.includes(action);
  },

  // Minigame score validation
  isValidMinigameScore(score) {
    return Number.isInteger(score) && score >= 0;
  },

  // Chat message validation
  isValidChatMessage(message) {
    if (!message || typeof message !== 'string') return false;
    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= 200;
  },

  // Emote validation
  isValidEmote(emote, allowedEmotes) {
    return allowedEmotes.includes(emote);
  },

  // Board configuration validation
  isValidBoardConfig(config) {
    return (
      config &&
      typeof config === 'object' &&
      Number.isInteger(config.size) &&
      config.size >= 20 &&
      config.size <= 400 &&
      Array.isArray(config.spaces) &&
      config.spaces.length === config.size
    );
  },

  // Sanitize player name
  sanitizePlayerName(name) {
    if (!name || typeof name !== 'string') return 'Player';
    return name.trim().substring(0, 20).replace(/[^a-zA-Z0-9_\- ]/g, '');
  },

  // Sanitize chat message
  sanitizeChatMessage(message) {
    if (!message || typeof message !== 'string') return '';
    return message.trim().substring(0, 200);
  }
};

// Game state validation
export const GameValidators = {
  // Validate turn action
  canPerformAction(player, action, gameState) {
    // Check if it's player's turn
    if (gameState.currentPlayerId !== player.id) {
      return { valid: false, reason: 'Not your turn' };
    }

    // Check player state
    if (player.state === 'disconnected') {
      return { valid: false, reason: 'Player disconnected' };
    }

    // Check action-specific requirements
    switch (action) {
      case 'roll_dice':
        if (player.energy < 1) {
          return { valid: false, reason: 'Insufficient energy' };
        }
        if (player.state !== 'waiting') {
          return { valid: false, reason: 'Cannot roll in current state' };
        }
        break;

      case 'end_turn':
        if (player.state !== 'waiting') {
          return { valid: false, reason: 'Cannot end turn in current state' };
        }
        break;

      case 'use_item':
        // Add item validation logic
        break;
    }

    return { valid: true };
  },

  // Validate minigame result
  isValidMinigameResult(result, minigameType) {
    if (!result || typeof result !== 'object') return false;

    // Common validations
    if (!Number.isInteger(result.score) || result.score < 0) return false;
    if (!Number.isInteger(result.timeElapsed) || result.timeElapsed < 0) return false;

    // Minigame-specific validations
    switch (minigameType) {
      case 'memory_match':
        return result.score <= 8 && result.timeElapsed >= 1000;
      case 'fruit_slash':
        return result.score <= 1000 && result.timeElapsed >= 1000;
      case 'quick_tap':
        return result.score <= 100 && result.timeElapsed >= 1000;
      default:
        return false;
    }
  },

  // Validate game room state
  isValidGameRoom(room) {
    return (
      room &&
      room.id &&
      room.players &&
      room.players.size >= 0 &&
      room.players.size <= 200 &&
      room.boardState &&
      room.currentPlayerId !== undefined
    );
  }
};