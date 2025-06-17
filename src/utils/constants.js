
export const GAME_CONSTANTS = {
    ENERGY_REGEN_RATE: 3600, // 1 hour in seconds
    MAX_ENERGY: 5,
    STAR_COST: 20,
    BLUE_SPACE_COINS: 3,
    RED_SPACE_COINS: -3,
    MAX_PLAYERS_PER_GAME: 8,
    BOARD_SIZES: {
        SMALL: { width: 20, height: 20 },
        MEDIUM: { width: 50, height: 50 },
        LARGE: { width: 100, height: 100 }
    }
};

export const PLAYER_COLORS = [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500'
];