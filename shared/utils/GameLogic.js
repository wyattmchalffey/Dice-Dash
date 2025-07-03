import { GAME_CONFIG, PLAYER_STATES, TURN_PHASES } from '../constants/GameConstants.js';
import { SPACE_TYPES, RANDOM_EVENTS, TOTAL_EVENT_WEIGHT } from '../constants/SpaceTypes.js';

// Dice rolling logic
export function rollDice(numDice = 1) {
  const rolls = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(
      Math.floor(Math.random() * (GAME_CONFIG.MAX_DICE_VALUE - GAME_CONFIG.MIN_DICE_VALUE + 1)) + 
      GAME_CONFIG.MIN_DICE_VALUE
    );
  }
  return {
    rolls,
    total: rolls.reduce((sum, roll) => sum + roll, 0)
  };
}

// Calculate new position after moving
export function calculateNewPosition(currentPosition, spaces, boardSize) {
  return (currentPosition + spaces) % boardSize;
}

// Check if player passed start
export function checkPassedStart(oldPosition, newPosition, boardSize) {
  return newPosition < oldPosition && newPosition !== 0;
}

// Get random event
export function getRandomEvent() {
  const randomWeight = Math.random() * TOTAL_EVENT_WEIGHT;
  let currentWeight = 0;
  
  for (const event of RANDOM_EVENTS) {
    currentWeight += event.weight;
    if (randomWeight <= currentWeight) {
      return event;
    }
  }
  
  return RANDOM_EVENTS[0]; // Fallback
}

// Calculate space action result
export function calculateSpaceAction(spaceType, player) {
  const result = {
    coins: 0,
    energy: 0,
    gems: 0,
    message: '',
    action: null
  };
  
  switch (spaceType) {
    case SPACE_TYPES.BLUE:
      result.coins = GAME_CONFIG.BLUE_SPACE_REWARD;
      result.message = `+${GAME_CONFIG.BLUE_SPACE_REWARD} coins!`;
      break;
      
    case SPACE_TYPES.RED:
      result.coins = -GAME_CONFIG.RED_SPACE_PENALTY;
      result.message = `-${GAME_CONFIG.RED_SPACE_PENALTY} coins!`;
      break;
      
    case SPACE_TYPES.STAR:
      result.coins = GAME_CONFIG.STAR_SPACE_REWARD;
      result.message = `Star collected! +${GAME_CONFIG.STAR_SPACE_REWARD} coins!`;
      break;
      
    case SPACE_TYPES.MINIGAME:
      result.action = 'start_minigame';
      result.message = 'Time for a minigame!';
      break;
      
    case SPACE_TYPES.EVENT:
      const event = getRandomEvent();
      if (event.effect.coins) result.coins = event.effect.coins;
      if (event.effect.energy) result.energy = event.effect.energy;
      if (event.effect.teleport) result.action = 'teleport';
      result.message = event.description;
      break;
      
    case SPACE_TYPES.SHOP:
      result.action = 'open_shop';
      result.message = 'Welcome to the shop!';
      break;
      
    case SPACE_TYPES.WARP:
      result.action = 'warp';
      result.message = 'Warping to a new location!';
      break;
  }
  
  return result;
}

// Validate player can take turn
export function canPlayerTakeTurn(player, currentTurnPlayerId) {
  return (
    player.id === currentTurnPlayerId &&
    player.state === PLAYER_STATES.WAITING &&
    player.energy >= GAME_CONFIG.ENERGY_COST_PER_TURN
  );
}

// Calculate energy regeneration
export function calculateEnergyRegen(lastRegenTime, currentTime, maxEnergy) {
  const regenTime = GAME_CONFIG.DEMO_MODE ? 
    GAME_CONFIG.DEMO_ENERGY_REGEN_TIME : 
    GAME_CONFIG.ENERGY_REGEN_TIME;
    
  const timePassed = currentTime - lastRegenTime;
  const energyToAdd = Math.floor(timePassed / regenTime);
  
  return {
    energyToAdd: Math.min(energyToAdd, maxEnergy),
    nextRegenTime: lastRegenTime + (energyToAdd * regenTime)
  };
}

// Calculate minigame reward
export function calculateMinigameReward(minigameType, score, timeElapsed) {
  // Base reward
  let reward = GAME_CONFIG.MINIGAME_WIN_REWARD;
  
  // Bonus for high scores
  if (score > 100) reward += 5;
  if (score > 200) reward += 10;
  
  // Bonus for quick completion
  if (timeElapsed < 10000) reward += 5; // Under 10 seconds
  
  return reward;
}

// Validate board position
export function isValidBoardPosition(position, boardSize) {
  return position >= 0 && position < boardSize;
}

// Calculate distance between two board positions
export function calculateBoardDistance(pos1, pos2, boardSize) {
  const forward = (pos2 - pos1 + boardSize) % boardSize;
  const backward = (pos1 - pos2 + boardSize) % boardSize;
  return Math.min(forward, backward);
}

// Get nearby players
export function getNearbyPlayers(players, position, range = 3) {
  return players.filter(player => {
    const distance = calculateBoardDistance(player.position, position, 100);
    return distance <= range && distance > 0;
  });
}

// Format time for display
export function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate next energy regen time
export function getNextEnergyRegenTime(currentEnergy, maxEnergy, lastRegenTime) {
  if (currentEnergy >= maxEnergy) return null;
  
  const regenTime = GAME_CONFIG.DEMO_MODE ? 
    GAME_CONFIG.DEMO_ENERGY_REGEN_TIME : 
    GAME_CONFIG.ENERGY_REGEN_TIME;
    
  return lastRegenTime + regenTime;
}