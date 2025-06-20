// src/systems/enhanced-board-system.js
// Enhanced board system supporting 200+ players and multiple themes

export const BOARD_THEMES = {
    JUNGLE_ADVENTURE: {
        id: 'jungle_adventure',
        name: 'Jungle Adventure',
        description: 'Navigate through ancient jungle temples and mysterious ruins',
        backgroundColor: '#1a4a3a',
        pathColor: '#8b5a2b',
        unlockLevel: 1,
        specialFeatures: ['vine_swings', 'hidden_treasures', 'animal_encounters'],
        ambientSounds: ['jungle_birds', 'flowing_water', 'rustling_leaves'],
        weatherEffects: ['rain', 'mist']
    },
    SPACE_STATION: {
        id: 'space_station',
        name: 'Cosmic Station Omega',
        description: 'Float through zero gravity in a massive space station',
        backgroundColor: '#0a0a2a',
        pathColor: '#4a4a8a',
        unlockLevel: 5,
        specialFeatures: ['zero_gravity', 'airlock_chambers', 'asteroid_fields'],
        ambientSounds: ['humming_machinery', 'radio_static', 'distant_engines'],
        weatherEffects: ['solar_flares', 'meteor_showers']
    },
    MEDIEVAL_CASTLE: {
        id: 'medieval_castle',
        name: 'Dragon\'s Keep Castle',
        description: 'Explore the halls and towers of an ancient castle',
        backgroundColor: '#2a2a1a',
        pathColor: '#6a6a4a',
        unlockLevel: 10,
        specialFeatures: ['drawbridges', 'secret_passages', 'dragon_encounters'],
        ambientSounds: ['medieval_music', 'crackling_fire', 'distant_thunder'],
        weatherEffects: ['fog', 'storm']
    },
    UNDERWATER_CITY: {
        id: 'underwater_city',
        name: 'Atlantis Deep',
        description: 'Dive into the depths of a lost underwater civilization',
        backgroundColor: '#1a2a4a',
        pathColor: '#4a6a8a',
        unlockLevel: 15,
        specialFeatures: ['bubble_streams', 'coral_gardens', 'sea_creatures'],
        ambientSounds: ['underwater_bubbles', 'whale_songs', 'ocean_currents'],
        weatherEffects: ['underwater_currents', 'bioluminescence']
    },
    CYBER_CITY: {
        id: 'cyber_city',
        name: 'Neon Nexus',
        description: 'Race through a futuristic cyberpunk metropolis',
        backgroundColor: '#1a1a2a',
        pathColor: '#4a2a6a',
        unlockLevel: 20,
        specialFeatures: ['holo_platforms', 'data_streams', 'cyber_portals'],
        ambientSounds: ['electronic_music', 'data_processing', 'city_traffic'],
        weatherEffects: ['neon_rain', 'data_storms']
    }
};

export const ENHANCED_SPACE_TYPES = {
    // Basic spaces
    BLUE: {
        color: '#3b82f6',
        name: 'Coin Space',
        effect: 'gain_coins',
        value: 3,
        description: 'Gain 3 coins'
    },
    RED: {
        color: '#ef4444',
        name: 'Loss Space',
        effect: 'lose_coins',
        value: 3,
        description: 'Lose 3 coins'
    },
    
    // Special spaces
    MINIGAME: {
        color: '#f59e0b',
        name: 'Mini-Game Space',
        effect: 'trigger_minigame',
        description: 'Play a mini-game!'
    },
    EVENT: {
        color: '#8b5cf6',
        name: 'Event Space',
        effect: 'random_event',
        description: 'Random event occurs'
    },
    SHOP: {
        color: '#10b981',
        name: 'Shop Space',
        effect: 'open_shop',
        description: 'Visit the shop'
    },
    WARP: {
        color: '#06b6d4',
        name: 'Warp Space',
        effect: 'warp_player',
        description: 'Teleport to another area'
    },
    STAR: {
        color: '#fbbf24',
        name: 'Star Space',
        effect: 'collect_star',
        value: 1,
        description: 'Collect a victory star!'
    },
    
    // Theme-specific spaces
    JUNGLE_VINE: {
        color: '#22c55e',
        name: 'Vine Swing',
        effect: 'vine_swing',
        themes: ['jungle_adventure'],
        description: 'Swing across on vines'
    },
    SPACE_AIRLOCK: {
        color: '#64748b',
        name: 'Airlock',
        effect: 'airlock_sequence',
        themes: ['space_station'],
        description: 'Navigate the airlock'
    },
    CASTLE_DRAWBRIDGE: {
        color: '#92400e',
        name: 'Drawbridge',
        effect: 'drawbridge_cross',
        themes: ['medieval_castle'],
        description: 'Cross the drawbridge'
    },
    UNDERWATER_CURRENT: {
        color: '#0ea5e9',
        name: 'Ocean Current',
        effect: 'current_boost',
        themes: ['underwater_city'],
        description: 'Ride the current'
    },
    CYBER_PORTAL: {
        color: '#c026d3',
        name: 'Data Portal',
        effect: 'cyber_portal',
        themes: ['cyber_city'],
        description: 'Enter the data stream'
    }
};

export class EnhancedBoardSystem {
    constructor() {
        this.boards = new Map();
        this.playerPositions = new Map();
        this.starPositions = new Map();
        this.boardStates = new Map();
        this.maxPlayersPerBoard = 200;
        
        this.initializeDefaultBoards();
    }

    // Initialize default board configurations
    initializeDefaultBoards() {
        Object.values(BOARD_THEMES).forEach(theme => {
            this.createThemeBoard(theme);
        });
    }

    // Create a board for a specific theme
    createThemeBoard(theme) {
        const boardConfig = {
            id: `board_${theme.id}`,
            theme: theme,
            spaces: this.generateThemeSpaces(theme),
            starSpaces: this.generateStarSpaces(theme),
            shortcuts: this.generateShortcuts(theme),
            size: { width: 100, height: 100 },
            maxPlayers: this.maxPlayersPerBoard,
            specialEvents: this.generateSpecialEvents(theme)
        };

        this.boards.set(boardConfig.id, boardConfig);
        return boardConfig;
    }

    // Generate spaces for a themed board
    generateThemeSpaces(theme) {
        const spaces = [];
        const numSpaces = 75; // Main path spaces
        const pathRadius = 35;
        const centerX = 50;
        const centerY = 50;

        // Create main circular path
        for (let i = 0; i < numSpaces; i++) {
            const angle = (i / numSpaces) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * pathRadius;
            const y = centerY + Math.sin(angle) * pathRadius;
            
            let spaceType = this.getSpaceTypeForPosition(i, numSpaces, theme);
            
            spaces.push({
                id: i,
                x: Math.round(x),
                y: Math.round(y),
                type: spaceType,
                connections: [i === 0 ? numSpaces - 1 : i - 1, (i + 1) % numSpaces],
                theme: theme.id,
                specialProperties: this.getSpecialProperties(spaceType, theme)
            });
        }

        // Add inner branch paths
        const branchSpaces = this.generateBranchPaths(theme, numSpaces);
        spaces.push(...branchSpaces);

        return spaces;
    }

    // Determine space type based on position and theme
    getSpaceTypeForPosition(position, totalSpaces, theme) {
        // Special positions
        if (position === 0) return 'BLUE'; // Start space
        if (position % 15 === 0) return 'STAR'; // Star spaces every 15 spaces
        if (position % 12 === 0) return 'MINIGAME';
        if (position % 8 === 0) return 'SHOP';
        if (position % 20 === 0) return 'WARP';
        
        // Theme-specific spaces
        if (theme.id === 'jungle_adventure' && position % 10 === 5) return 'JUNGLE_VINE';
        if (theme.id === 'space_station' && position % 11 === 6) return 'SPACE_AIRLOCK';
        if (theme.id === 'medieval_castle' && position % 13 === 7) return 'CASTLE_DRAWBRIDGE';
        if (theme.id === 'underwater_city' && position % 9 === 4) return 'UNDERWATER_CURRENT';
        if (theme.id === 'cyber_city' && position % 14 === 8) return 'CYBER_PORTAL';
        
        // Random distribution of basic spaces
        const rand = Math.random();
        if (rand < 0.4) return 'BLUE';
        if (rand < 0.6) return 'RED';
        if (rand < 0.8) return 'EVENT';
        return 'BLUE';
    }

    // Generate branch paths for more complex navigation
    generateBranchPaths(theme, mainPathSpaces) {
        const branches = [];
        const numBranches = 3;
        
        for (let b = 0; b < numBranches; b++) {
            const branchStart = mainPathSpaces + (b * 10);
            const branchLength = 8;
            const connectionPoint = Math.floor((mainPathSpaces / numBranches) * b);
            
            for (let i = 0; i < branchLength; i++) {
                const angle = (b * 120 + i * 15) * (Math.PI / 180);
                const radius = 15 + i * 3;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                
                branches.push({
                    id: branchStart + i,
                    x: Math.round(x),
                    y: Math.round(y),
                    type: i === branchLength - 1 ? 'WARP' : this.getSpaceTypeForPosition(i, branchLength, theme),
                    connections: this.getBranchConnections(branchStart + i, connectionPoint, branchLength, i),
                    theme: theme.id,
                    isBranch: true,
                    branchId: b
                });
            }
        }
        
        return branches;
    }

    // Get connections for branch spaces
    getBranchConnections(spaceId, connectionPoint, branchLength, position) {
        if (position === 0) {
            return [connectionPoint]; // Connect to main path
        } else if (position === branchLength - 1) {
            return [spaceId - 1, connectionPoint]; // Connect back to main path
        } else {
            return [spaceId - 1, spaceId + 1]; // Connect to adjacent branch spaces
        }
    }

    // Generate star collection spaces
    generateStarSpaces(theme) {
        return [
            { id: 'star_1', x: 25, y: 25, active: true },
            { id: 'star_2', x: 75, y: 25, active: true },
            { id: 'star_3', x: 50, y: 75, active: true },
            { id: 'star_4', x: 15, y: 50, active: true },
            { id: 'star_5', x: 85, y: 50, active: true }
        ];
    }

    // Generate shortcut connections
    generateShortcuts(theme) {
        return [
            { from: 10, to: 35, cost: 10, type: 'coin_shortcut' },
            { from: 25, to: 50, cost: 0, type: 'free_shortcut' },
            { from: 40, to: 65, cost: 15, type: 'premium_shortcut' }
        ];
    }

    // Generate special theme events
    generateSpecialEvents(theme) {
        const baseEvents = [
            {
                id: 'coin_rain',
                name: 'Coin Rain',
                description: 'Coins fall from the sky!',
                probability: 0.1,
                effect: { type: 'gain_coins', value: 10 }
            },
            {
                id: 'energy_boost',
                name: 'Energy Surge',
                description: 'Gain extra energy!',
                probability: 0.05,
                effect: { type: 'gain_energy', value: 1 }
            }
        ];

        // Add theme-specific events
        switch (theme.id) {
            case 'jungle_adventure':
                baseEvents.push({
                    id: 'monkey_mischief',
                    name: 'Monkey Mischief',
                    description: 'Monkeys steal some coins!',
                    probability: 0.08,
                    effect: { type: 'lose_coins', value: 5 }
                });
                break;
            case 'space_station':
                baseEvents.push({
                    id: 'solar_flare',
                    name: 'Solar Flare',
                    description: 'Systems malfunction, skip next turn!',
                    probability: 0.06,
                    effect: { type: 'skip_turn', value: 1 }
                });
                break;
            case 'medieval_castle':
                baseEvents.push({
                    id: 'dragon_encounter',
                    name: 'Dragon Encounter',
                    description: 'Face the dragon in battle!',
                    probability: 0.04,
                    effect: { type: 'minigame', value: 'dragon_battle' }
                });
                break;
        }

        return baseEvents;
    }

    // Get special properties for space types
    getSpecialProperties(spaceType, theme) {
        const properties = {};
        
        if (spaceType === 'JUNGLE_VINE') {
            properties.animation = 'vine_sway';
            properties.sound = 'jungle_swing';
        } else if (spaceType === 'SPACE_AIRLOCK') {
            properties.animation = 'airlock_cycle';
            properties.sound = 'hiss_pressurize';
        } else if (spaceType === 'UNDERWATER_CURRENT') {
            properties.animation = 'flowing_water';
            properties.sound = 'water_rush';
        }
        
        return properties;
    }

    // Create a new game board instance
    createBoardInstance(themeId, gameId) {
        const theme = BOARD_THEMES[themeId.toUpperCase()];
        if (!theme) throw new Error(`Theme ${themeId} not found`);

        const board = this.createThemeBoard(theme);
        const instanceId = `${gameId}_${Date.now()}`;
        
        this.boardStates.set(instanceId, {
            ...board,
            instanceId,
            gameId,
            players: new Map(),
            starStates: new Map(),
            activeEvents: [],
            weatherEffect: null,
            createdAt: Date.now()
        });

        return this.boardStates.get(instanceId);
    }

    // Add player to board
    addPlayerToBoard(instanceId, player) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) throw new Error('Board instance not found');
        
        if (boardState.players.size >= this.maxPlayersPerBoard) {
            throw new Error('Board is full');
        }

        boardState.players.set(player.id, {
            ...player,
            position: 0, // Start at space 0
            coins: 0,
            stars: 0,
            energy: 5,
            joinedAt: Date.now()
        });

        return boardState;
    }

    // Move player on board
    movePlayer(instanceId, playerId, spaces) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) throw new Error('Board instance not found');

        const player = boardState.players.get(playerId);
        if (!player) throw new Error('Player not found on board');

        const currentSpace = boardState.spaces.find(s => s.id === player.position);
        const newPosition = this.calculateNewPosition(currentSpace, spaces, boardState);
        
        player.position = newPosition;
        
        // Trigger space effect
        const newSpace = boardState.spaces.find(s => s.id === newPosition);
        if (newSpace) {
            this.triggerSpaceEffect(instanceId, playerId, newSpace);
        }

        return { player, newSpace };
    }

    // Calculate new position after movement
    calculateNewPosition(currentSpace, spaces, boardState) {
        let position = currentSpace.id;
        
        for (let i = 0; i < spaces; i++) {
            const space = boardState.spaces.find(s => s.id === position);
            if (space && space.connections.length > 0) {
                // Choose next connection (usually the forward one)
                position = space.connections[space.connections.length - 1];
            }
        }
        
        return position;
    }

    // Trigger space effect when player lands
    triggerSpaceEffect(instanceId, playerId, space) {
        const boardState = this.boardStates.get(instanceId);
        const player = boardState.players.get(playerId);
        const spaceType = ENHANCED_SPACE_TYPES[space.type];
        
        if (!spaceType) return;

        const effect = {
            playerId,
            spaceId: space.id,
            effect: spaceType.effect,
            timestamp: Date.now()
        };

        switch (spaceType.effect) {
            case 'gain_coins':
                player.coins += spaceType.value || 3;
                effect.value = spaceType.value || 3;
                break;
            case 'lose_coins':
                player.coins = Math.max(0, player.coins - (spaceType.value || 3));
                effect.value = -(spaceType.value || 3);
                break;
            case 'collect_star':
                player.stars += 1;
                this.moveStarSpace(instanceId, space.id);
                effect.value = 1;
                break;
            case 'trigger_minigame':
                effect.minigame = this.selectRandomMinigame(boardState.theme);
                break;
            case 'warp_player':
                const warpTarget = this.selectWarpTarget(instanceId, space.id);
                player.position = warpTarget;
                effect.warpTarget = warpTarget;
                break;
            case 'vine_swing':
                // Jungle-specific: swing ahead extra spaces
                const swingSpaces = Math.floor(Math.random() * 3) + 2; // 2-4 spaces
                const newPos = this.calculateNewPosition(space, swingSpaces, boardState);
                player.position = newPos;
                effect.extraMovement = swingSpaces;
                break;
            case 'airlock_sequence':
                // Space-specific: navigate airlock mini-challenge
                effect.minigame = 'airlock_sequence';
                break;
            case 'current_boost':
                // Underwater-specific: ride the current
                player.coins += 5;
                effect.value = 5;
                break;
        }

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('boardSpaceEffect', {
            detail: { instanceId, effect }
        }));

        return effect;
    }

    // Move star space after collection
    moveStarSpace(instanceId, starSpaceId) {
        const boardState = this.boardStates.get(instanceId);
        const starSpace = boardState.spaces.find(s => s.id === starSpaceId);
        
        if (starSpace) {
            // Find a new random location for the star
            const availableSpaces = boardState.spaces.filter(s => 
                s.type === 'BLUE' || s.type === 'RED'
            );
            
            if (availableSpaces.length > 0) {
                const newLocation = availableSpaces[Math.floor(Math.random() * availableSpaces.length)];
                starSpace.x = newLocation.x;
                starSpace.y = newLocation.y;
            }
        }
    }

    // Select random minigame based on theme
    selectRandomMinigame(theme) {
        const themeGames = {
            jungle_adventure: ['fruit_slash', 'memory_match', 'precision_tap'],
            space_station: ['precision_tap', 'racing_dash', 'tower_rush'],
            medieval_castle: ['tower_rush', 'memory_match', 'lucky_spin'],
            underwater_city: ['racing_dash', 'fruit_slash', 'precision_tap'],
            cyber_city: ['tower_rush', 'precision_tap', 'racing_dash']
        };
        
        const games = themeGames[theme.id] || ['fruit_slash', 'precision_tap', 'memory_match'];
        return games[Math.floor(Math.random() * games.length)];
    }

    // Select warp target
    selectWarpTarget(instanceId, currentSpaceId) {
        const boardState = this.boardStates.get(instanceId);
        const warpSpaces = boardState.spaces.filter(s => 
            s.type === 'WARP' && s.id !== currentSpaceId
        );
        
        if (warpSpaces.length === 0) {
            return 0; // Return to start if no warp targets
        }
        
        const targetSpace = warpSpaces[Math.floor(Math.random() * warpSpaces.length)];
        return targetSpace.id;
    }

    // Get board state for rendering
    getBoardState(instanceId) {
        return this.boardStates.get(instanceId);
    }

    // Get player on board
    getPlayer(instanceId, playerId) {
        const boardState = this.boardStates.get(instanceId);
        return boardState?.players.get(playerId);
    }

    // Get all players on board
    getPlayers(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        return boardState ? Array.from(boardState.players.values()) : [];
    }

    // Update weather effects
    updateWeatherEffect(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) return;

        const theme = boardState.theme;
        const weatherEffects = theme.weatherEffects || [];
        
        // 10% chance to change weather every minute
        if (Math.random() < 0.1) {
            if (weatherEffects.length > 0) {
                boardState.weatherEffect = weatherEffects[Math.floor(Math.random() * weatherEffects.length)];
            } else {
                boardState.weatherEffect = null;
            }
            
            // Apply weather effects to gameplay
            this.applyWeatherEffects(instanceId, boardState.weatherEffect);
        }
    }

    // Apply weather effects to gameplay
    applyWeatherEffects(instanceId, weatherEffect) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState || !weatherEffect) return;

        switch (weatherEffect) {
            case 'rain':
                // Coin spaces give +1 extra coin
                boardState.spaces.forEach(space => {
                    if (space.type === 'BLUE') {
                        space.weatherBonus = 1;
                    }
                });
                break;
            case 'solar_flares':
                // Random energy drain events
                boardState.players.forEach(player => {
                    if (Math.random() < 0.1) {
                        player.energy = Math.max(0, player.energy - 1);
                    }
                });
                break;
            case 'fog':
                // Reduce visibility (UI effect)
                boardState.visibility = 0.7;
                break;
            case 'underwater_currents':
                // Random movement bonus
                boardState.players.forEach(player => {
                    if (Math.random() < 0.2) {
                        const extraSpaces = Math.floor(Math.random() * 2) + 1;
                        const newPos = this.calculateNewPosition(
                            boardState.spaces.find(s => s.id === player.position),
                            extraSpaces,
                            boardState
                        );
                        player.position = newPos;
                    }
                });
                break;
        }

        window.dispatchEvent(new CustomEvent('weatherEffect', {
            detail: { instanceId, weatherEffect }
        }));
    }

    // Trigger random events
    triggerRandomEvent(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) return;

        const events = boardState.specialEvents;
        const eligibleEvents = events.filter(event => Math.random() < event.probability);
        
        if (eligibleEvents.length === 0) return;

        const selectedEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
        
        // Apply event to all players or random player
        const targetPlayers = selectedEvent.global ? 
            Array.from(boardState.players.values()) : 
            [Array.from(boardState.players.values())[Math.floor(Math.random() * boardState.players.size)]];

        targetPlayers.forEach(player => {
            this.applyEventEffect(player, selectedEvent.effect);
        });

        window.dispatchEvent(new CustomEvent('randomEvent', {
            detail: { 
                instanceId, 
                event: selectedEvent, 
                affectedPlayers: targetPlayers.map(p => p.id) 
            }
        }));

        return selectedEvent;
    }

    // Apply event effect to player
    applyEventEffect(player, effect) {
        switch (effect.type) {
            case 'gain_coins':
                player.coins += effect.value;
                break;
            case 'lose_coins':
                player.coins = Math.max(0, player.coins - effect.value);
                break;
            case 'gain_energy':
                player.energy = Math.min(5, player.energy + effect.value);
                break;
            case 'skip_turn':
                player.skipTurns = (player.skipTurns || 0) + effect.value;
                break;
            case 'minigame':
                player.pendingMinigame = effect.value;
                break;
        }
    }

    // Get available themes for player level
    getAvailableThemes(playerLevel) {
        return Object.values(BOARD_THEMES).filter(theme => 
            playerLevel >= theme.unlockLevel
        );
    }

    // Get theme by ID
    getTheme(themeId) {
        return BOARD_THEMES[themeId.toUpperCase()];
    }

    // Get leaderboard for board instance
    getLeaderboard(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) return [];

        return Array.from(boardState.players.values())
            .sort((a, b) => {
                // Sort by stars first, then coins
                if (a.stars !== b.stars) return b.stars - a.stars;
                return b.coins - a.coins;
            })
            .map((player, index) => ({
                rank: index + 1,
                playerId: player.id,
                playerName: player.name,
                stars: player.stars,
                coins: player.coins,
                position: player.position
            }));
    }

    // Check win condition
    checkWinCondition(instanceId, playerId) {
        const boardState = this.boardStates.get(instanceId);
        const player = boardState?.players.get(playerId);
        
        if (!player) return false;

        // Win condition: collect 3 stars
        return player.stars >= 3;
    }

    // Get space at position
    getSpaceAtPosition(instanceId, position) {
        const boardState = this.boardStates.get(instanceId);
        return boardState?.spaces.find(s => s.id === position);
    }

    // Get connected spaces from current position
    getConnectedSpaces(instanceId, position) {
        const space = this.getSpaceAtPosition(instanceId, position);
        if (!space) return [];

        const boardState = this.boardStates.get(instanceId);
        return space.connections.map(connId => 
            boardState.spaces.find(s => s.id === connId)
        ).filter(Boolean);
    }

    // Save board state (for persistence)
    saveBoardState(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) return null;

        // Convert Map to Object for serialization
        const saveData = {
            ...boardState,
            players: Object.fromEntries(boardState.players),
            starStates: Object.fromEntries(boardState.starStates)
        };

        return JSON.stringify(saveData);
    }

    // Load board state (from persistence)
    loadBoardState(instanceId, saveData) {
        const data = JSON.parse(saveData);
        
        // Convert Object back to Map
        data.players = new Map(Object.entries(data.players));
        data.starStates = new Map(Object.entries(data.starStates));
        
        this.boardStates.set(instanceId, data);
        return data;
    }

    // Clean up old board instances
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [instanceId, boardState] of this.boardStates) {
            if ((now - boardState.createdAt) > maxAge) {
                this.boardStates.delete(instanceId);
            }
        }
    }

    // Get board statistics
    getBoardStats(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) return null;

        const players = Array.from(boardState.players.values());
        
        return {
            playerCount: players.length,
            averageCoins: players.reduce((sum, p) => sum + p.coins, 0) / players.length,
            averageStars: players.reduce((sum, p) => sum + p.stars, 0) / players.length,
            mostActiveSpace: this.getMostLandedSpace(instanceId),
            currentWeather: boardState.weatherEffect,
            uptime: Date.now() - boardState.createdAt
        };
    }

    // Get most frequently landed space
    getMostLandedSpace(instanceId) {
        const boardState = this.boardStates.get(instanceId);
        if (!boardState) return null;

        const spaceCounts = new Map();
        
        boardState.players.forEach(player => {
            const count = spaceCounts.get(player.position) || 0;
            spaceCounts.set(player.position, count + 1);
        });

        let mostLanded = { spaceId: null, count: 0 };
        for (const [spaceId, count] of spaceCounts) {
            if (count > mostLanded.count) {
                mostLanded = { spaceId, count };
            }
        }

        return mostLanded;
    }
}