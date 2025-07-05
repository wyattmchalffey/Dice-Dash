// Board space type definitions
export const SPACE_TYPES = {
  START: 'start',
  BLUE: 'blue',
  RED: 'red',
  MINIGAME: 'minigame',
  EVENT: 'event',
  STAR: 'star',
  SHOP: 'shop',
  WARP: 'warp'
};

// Space configuration
export const SPACE_CONFIG = {
  [SPACE_TYPES.START]: {
    color: 0x4caf50,
    icon: 'START',
    description: 'Starting position',
    action: 'none'
  },
  [SPACE_TYPES.BLUE]: {
    color: 0x2196f3,
    icon: '+3',
    description: 'Gain 3 coins',
    action: 'add_coins'
  },
  [SPACE_TYPES.RED]: {
    color: 0xf44336,
    icon: '-3',
    description: 'Lose 3 coins',
    action: 'remove_coins'
  },
  [SPACE_TYPES.MINIGAME]: {
    color: 0x9c27b0,
    icon: '🎮',
    description: 'Play a minigame',
    action: 'start_minigame'
  },
  [SPACE_TYPES.EVENT]: {
    color: 0xffc107,
    icon: '?',
    description: 'Random event',
    action: 'trigger_event'
  },
  [SPACE_TYPES.STAR]: {
    color: 0xffd700,
    icon: '⭐',
    description: 'Collect a star',
    action: 'collect_star'
  },
  [SPACE_TYPES.SHOP]: {
    color: 0x795548,
    icon: '🛍️',
    description: 'Visit the shop',
    action: 'open_shop'
  },
  [SPACE_TYPES.WARP]: {
    color: 0x673ab7,
    icon: '🌀',
    description: 'Teleport to another space',
    action: 'warp'
  }
};

// Random events
export const RANDOM_EVENTS = [
  {
    id: 'treasure',
    name: 'Found Treasure!',
    description: 'You discovered a hidden treasure chest!',
    effect: { coins: 5 },
    weight: 25
  },
  {
    id: 'lightning',
    name: 'Lightning Strike!',
    description: 'You were struck by lightning!',
    effect: { coins: -5 },
    weight: 20
  },
  {
    id: 'lucky_day',
    name: 'Lucky Day!',
    description: 'Today is your lucky day!',
    effect: { coins: 10 },
    weight: 15
  },
  {
    id: 'pickpocket',
    name: 'Pickpocket!',
    description: 'A thief stole some of your coins!',
    effect: { coins: -3 },
    weight: 25
  },
  {
    id: 'energy_boost',
    name: 'Energy Drink!',
    description: 'You found an energy drink!',
    effect: { energy: 1 },
    weight: 10
  },
  {
    id: 'teleport',
    name: 'Magic Portal!',
    description: 'A magic portal appears!',
    effect: { teleport: true },
    weight: 5
  }
];

// Calculate total weight for probability
export const TOTAL_EVENT_WEIGHT = RANDOM_EVENTS.reduce((sum, event) => sum + event.weight, 0);