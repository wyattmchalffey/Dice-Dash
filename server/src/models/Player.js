import { GAME_CONFIG, PLAYER_STATES } from '../../../shared/constants/GameConstants.js';

export class Player {
  constructor(id, name, startPosition = 0) {
    this.id = id;
    this.name = name;
    this.position = startPosition;
    this.coins = GAME_CONFIG.STARTING_COINS;
    this.gems = GAME_CONFIG.STARTING_GEMS;
    this.energy = GAME_CONFIG.DEFAULT_ENERGY;
    this.state = PLAYER_STATES.WAITING;
    this.isDisconnected = false;
    this.joinedAt = Date.now();
    this.lastActivityAt = Date.now();
    
    // Stats
    this.stats = {
      turnsPlayed: 0,
      spacesMovedTotal: 0,
      coinsEarned: 0,
      coinsLost: 0,
      minigamesPlayed: 0,
      minigamesWon: 0,
      starsCollected: 0
    };
    
    // Inventory (for future implementation)
    this.inventory = {
      items: [],
      powerUps: []
    };
  }

  // Update player position
  setPosition(newPosition) {
    const spacesM = Math.abs(newPosition - this.position);
    this.position = newPosition;
    this.stats.spacesMovedTotal += spacesMoved;
    this.updateActivity();
  }

  // Add coins
  addCoins(amount) {
    this.coins += amount;
    if (this.coins < 0) this.coins = 0;
    
    if (amount > 0) {
      this.stats.coinsEarned += amount;
    } else {
      this.stats.coinsLost += Math.abs(amount);
    }
    
    this.updateActivity();
  }

  // Add gems
  addGems(amount) {
    this.gems += amount;
    if (this.gems < 0) this.gems = 0;
    this.updateActivity();
  }

  // Add energy
  addEnergy(amount) {
    this.energy = Math.min(this.energy + amount, GAME_CONFIG.MAX_ENERGY);
    this.updateActivity();
  }

  // Use energy
  useEnergy(amount) {
    if (this.energy >= amount) {
      this.energy -= amount;
      this.stats.turnsPlayed++;
      this.updateActivity();
      return true;
    }
    return false;
  }

  // Check if player has enough energy
  hasEnergy(amount) {
    return this.energy >= amount;
  }

  // Set player state
  setState(state) {
    this.state = state;
    this.updateActivity();
  }

  // Set disconnected status
  setDisconnected() {
    this.isDisconnected = true;
    this.state = PLAYER_STATES.DISCONNECTED;
  }

  // Reconnect player
  reconnect() {
    this.isDisconnected = false;
    this.state = PLAYER_STATES.WAITING;
    this.updateActivity();
  }

  // Update last activity timestamp
  updateActivity() {
    this.lastActivityAt = Date.now();
  }

  // Update minigame stats
  updateMinigameStats(won) {
    this.stats.minigamesPlayed++;
    if (won) {
      this.stats.minigamesWon++;
    }
  }

  // Collect star
  collectStar() {
    this.stats.starsCollected++;
    this.addCoins(GAME_CONFIG.STAR_SPACE_REWARD);
  }

  // Get public player data (safe to send to clients)
  getPublicData() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      coins: this.coins,
      energy: this.energy,
      state: this.state,
      isDisconnected: this.isDisconnected,
      stats: {
        turnsPlayed: this.stats.turnsPlayed,
        starsCollected: this.stats.starsCollected,
        minigamesWon: this.stats.minigamesWon
      }
    };
  }

  // Get full player data (for server use)
  getFullData() {
    return {
      ...this.getPublicData(),
      gems: this.gems,
      inventory: this.inventory,
      stats: this.stats,
      joinedAt: this.joinedAt,
      lastActivityAt: this.lastActivityAt
    };
  }

  // Check if player has been inactive
  isInactive(inactivityThreshold = 5 * 60 * 1000) { // 5 minutes
    return Date.now() - this.lastActivityAt > inactivityThreshold;
  }

  // Add item to inventory
  addItem(item) {
    this.inventory.items.push({
      ...item,
      acquiredAt: Date.now()
    });
  }

  // Use item from inventory
  useItem(itemId) {
    const itemIndex = this.inventory.items.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      const item = this.inventory.items.splice(itemIndex, 1)[0];
      return item;
    }
    return null;
  }

  // Has specific item
  hasItem(itemId) {
    return this.inventory.items.some(item => item.id === itemId);
  }
}