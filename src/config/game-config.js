// src/config/game-config.js
export const gameConfig = {
    boards: {
        magical_kingdom: {
            id: 'magical_kingdom',
            name: 'Magical Kingdom',
            size: { width: 60, height: 50 },
            density: 0.8
        }
    },

    gameModes: {
        classic: {
            name: 'Classic Adventure',
            maxPlayers: 4,
            starGoal: 3,
            energyRegenRate: 3600,
            turnLimit: 20,
            description: 'First to 3 stars wins!'
        },
        quick: {
            name: 'Quick Quest',
            maxPlayers: 6,
            starGoal: 2,
            energyRegenRate: 1800, // 30 minutes
            turnLimit: 15,
            description: 'A faster game - first to 2 stars!'
        },
        epic: {
            name: 'Epic Journey',
            maxPlayers: 8,
            starGoal: 5,
            energyRegenRate: 7200, // 2 hours
            turnLimit: 30,
            description: 'An extended adventure for dedicated players!'
        }
    },

    // Visual settings
    graphics: {
        particleEffects: true,
        animationSpeed: 1.0,
        shadowQuality: 'high',
        glowEffects: true,
        trailEffects: true
    },

    // Sound settings (for future implementation)
    audio: {
        backgroundMusic: 'magical_kingdom_theme',
        soundEffects: true,
        volume: 0.7
    },

    // Gameplay constants
    gameplay: {
        initialCoins: 10,
        coinsPerBlueSpace: 3,
        coinsPerRedSpace: 3,
        starCost: 20,
        shopItemMaxCost: 20,
        minigameReward: 10,
        energyPerTurn: 1
    }
};