import { TURN_PHASES } from '../../../shared/constants/GameConstants.js';

export class TurnManager {
  constructor() {
    this.turnOrder = [];
    this.currentPlayerIndex = 0;
    this.turnNumber = 0;
    this.currentPhase = TURN_PHASES.WAITING;
    this.turnStartTime = null;
    this.turnHistory = [];
  }

  // Initialize turn order with player IDs
  initializeTurnOrder(playerIds) {
    // Randomize turn order
    this.turnOrder = [...playerIds].sort(() => Math.random() - 0.5);
    this.currentPlayerIndex = 0;
    this.turnNumber = 1;
    this.currentPhase = TURN_PHASES.WAITING;
    this.turnStartTime = Date.now();
    
    console.log('Turn order initialized:', this.turnOrder);
  }

  // Get current player ID
  getCurrentPlayer() {
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.currentPlayerIndex];
  }

  // Check if it's a specific player's turn
  isCurrentPlayer(playerId) {
    return this.getCurrentPlayer() === playerId;
  }

  // Move to next turn
  nextTurn() {
    // Record turn in history
    this.recordTurn();
    
    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
    
    // Increment turn number when we've gone through all players
    if (this.currentPlayerIndex === 0) {
      this.turnNumber++;
    }
    
    // Reset phase and timer
    this.currentPhase = TURN_PHASES.WAITING;
    this.turnStartTime = Date.now();
    
    return this.getCurrentPlayer();
  }

  // Set current phase
  setPhase(phase) {
    this.currentPhase = phase;
  }

  // Get current phase
  getPhase() {
    return this.currentPhase;
  }

  // Add player to turn order
  addPlayer(playerId) {
    if (!this.turnOrder.includes(playerId)) {
      this.turnOrder.push(playerId);
    }
  }

  // Remove player from turn order
  removePlayer(playerId) {
    const index = this.turnOrder.indexOf(playerId);
    if (index > -1) {
      this.turnOrder.splice(index, 1);
      
      // Adjust current player index if needed
      if (this.currentPlayerIndex >= this.turnOrder.length && this.turnOrder.length > 0) {
        this.currentPlayerIndex = 0;
      }
    }
  }

  // Get turn order
  getTurnOrder() {
    return [...this.turnOrder];
  }

  // Get turn statistics
  getTurnStats() {
    return {
      currentPlayer: this.getCurrentPlayer(),
      turnNumber: this.turnNumber,
      currentPhase: this.currentPhase,
      turnDuration: Date.now() - this.turnStartTime,
      playerIndex: this.currentPlayerIndex,
      totalPlayers: this.turnOrder.length
    };
  }

  // Record turn for history
  recordTurn() {
    if (this.turnStartTime) {
      this.turnHistory.push({
        playerId: this.getCurrentPlayer(),
        turnNumber: this.turnNumber,
        duration: Date.now() - this.turnStartTime,
        timestamp: Date.now()
      });
      
      // Keep only last 100 turns
      if (this.turnHistory.length > 100) {
        this.turnHistory.shift();
      }
    }
  }

  // Get turn history
  getTurnHistory() {
    return [...this.turnHistory];
  }

  // Check if turn has timed out
  isTurnTimedOut(timeoutMs = 30000) {
    return this.turnStartTime && (Date.now() - this.turnStartTime) > timeoutMs;
  }

  // Reset turn manager
  reset() {
    this.turnOrder = [];
    this.currentPlayerIndex = 0;
    this.turnNumber = 0;
    this.currentPhase = TURN_PHASES.WAITING;
    this.turnStartTime = null;
    this.turnHistory = [];
  }
}