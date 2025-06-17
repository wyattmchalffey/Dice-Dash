export const gameConfig = {
    boards: {
        classic: {
            id: 'classic',
            name: 'Classic Board',
            size: { width: 20, height: 20 },
            density: 0.8
        },
        massive: {
            id: 'massive',
            name: 'Massive World',
            size: { width: 50, height: 50 },
            density: 0.6
        },
        mega: {
            id: 'mega',
            name: 'Mega Universe',
            size: { width: 100, height: 100 },
            density: 0.5
        }
    },

    gameModes: {
        classic: {
            maxPlayers: 4,
            starGoal: 3,
            energyRegenRate: 3600
        },
        fast: {
            maxPlayers: 6,
            starGoal: 2,
            energyRegenRate: 1800 // 30 minutes
        },
        marathon: {
            maxPlayers: 8,
            starGoal: 5,
            energyRegenRate: 7200 // 2 hours
        }
    }
};