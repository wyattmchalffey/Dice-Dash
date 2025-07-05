// Game configuration constants shared between client and server
export const GAME_CONFIG = {
  MAX_PLAYERS_PER_BOARD: 200,
  MIN_PLAYERS_TO_START: 2,
  DEFAULT_ENERGY: 5,
  MAX_ENERGY: 5,
  ENERGY_REGEN_TIME: 20 * 60 * 1000, // 20 minutes in milliseconds
  ENERGY_COST_PER_TURN: 1,
  
  // For demo, use faster values
  DEMO_MODE: true,
  DEMO_ENERGY_REGEN_TIME: 20 * 1000, // 20 seconds for demo
  
  // Board configuration
  BOARD_SIZES: {
    TUTORIAL: 32,
    SMALL: 50,
    MEDIUM: 75,
    LARGE: 100,
    MEGA: 200
  },
  
  // Currency
  STARTING_COINS: 10,
  STARTING_GEMS: 0,
  
  // Space rewards/penalties
  BLUE_SPACE_REWARD: 3,
  RED_SPACE_PENALTY: 3,
  STAR_SPACE_REWARD: 20,
  MINIGAME_WIN_REWARD: 10,
  MINIGAME_SKIP_PENALTY: 5,
  
  // Dice
  MIN_DICE_VALUE: 1,
  MAX_DICE_VALUE: 6,
  
  // Animations
  MOVE_ANIMATION_DURATION: 300,
  DICE_ROLL_DURATION: 1000,
  
  // Network
  SOCKET_RECONNECT_ATTEMPTS: 5,
  SOCKET_RECONNECT_DELAY: 1000,
  TURN_TIMEOUT: 30000 // 30 seconds to take a turn
};

// Player states
export const PLAYER_STATES = {
  WAITING: 'waiting',
  ROLLING: 'rolling',
  MOVING: 'moving',
  IN_MINIGAME: 'in_minigame',
  CHOOSING: 'choosing',
  SPECTATING: 'spectating',
  DISCONNECTED: 'disconnected'
};

// Game states
export const GAME_STATES = {
  WAITING_FOR_PLAYERS: 'waiting_for_players',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

// Turn phases
export const TURN_PHASES = {
  WAITING: 'waiting',
  ROLLING: 'rolling',
  MOVING: 'moving',
  SPACE_ACTION: 'space_action',
  MINIGAME: 'minigame',
  END_TURN: 'end_turn'
};