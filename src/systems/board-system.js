// Enhanced Board System Implementation
// This implements all the board mechanics from the Game Design Document

// Board Space Types Configuration
export const SPACE_TYPES = {
    BLUE: {
        id: 'blue',
        name: 'Blue Space',
        color: '#3b82f6',
        effect: 'Gain 3 coins',
        weight: 35,
        action: (player) => ({
            coins: player.coins + 3,
            message: 'You gained 3 coins!'
        })
    },
    RED: {
        id: 'red',
        name: 'Red Space',
        color: '#ef4444',
        effect: 'Lose 3 coins',
        weight: 25,
        action: (player) => ({
            coins: Math.max(0, player.coins - 3),
            message: 'You lost 3 coins!'
        })
    },
    MINIGAME: {
        id: 'minigame',
        name: 'Mini-Game Space',
        color: '#8b5cf6',
        effect: 'Trigger mini-game',
        weight: 15,
        action: (player) => ({
            triggerMinigame: true,
            message: 'Time for a mini-game!'
        })
    },
    EVENT: {
        id: 'event',
        name: 'Event Space',
        color: '#f97316',
        effect: 'Random event',
        weight: 10,
        action: (player) => {
            const events = [
                { coins: 10, message: 'Lucky! You found 10 coins!' },
                { coins: -5, message: 'Oh no! You dropped 5 coins!' },
                { stars: 1, message: 'A shooting star! You gained a star!' },
                { warp: true, message: 'Space-time distortion! You\'re being warped!' }
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            return {
                coins: player.coins + (event.coins || 0),
                stars: player.stars + (event.stars || 0),
                triggerWarp: event.warp,
                message: event.message
            };
        }
    },
    SHOP: {
        id: 'shop',
        name: 'Item Shop',
        color: '#10b981',
        effect: 'Buy items',
        weight: 8,
        action: (player) => ({
            triggerShop: true,
            message: 'Welcome to the shop!'
        })
    },
    WARP: {
        id: 'warp',
        name: 'Warp Space',
        color: '#06b6d4',
        effect: 'Teleport to another area',
        weight: 5,
        action: (player, board) => {
            const warpSpaces = board.spaces.filter(s =>
                s.type === 'warp' && s.id !== player.position
            );
            const randomSpace = warpSpaces.length > 0
                ? warpSpaces[Math.floor(Math.random() * warpSpaces.length)]
                : board.spaces[Math.floor(Math.random() * board.spaces.length)];

            return {
                position: randomSpace.id,
                message: `Warped to ${randomSpace.name}!`
            };
        }
    },
    STAR: {
        id: 'star',
        name: 'Star Space',
        color: '#fbbf24',
        effect: 'Buy star for 20 coins',
        weight: 2,
        action: (player, board) => {
            if (player.coins >= 20) {
                // Move star to new location after purchase
                const newStarSpace = board.spaces[Math.floor(Math.random() * board.spaces.length)];

                return {
                    coins: player.coins - 20,
                    stars: player.stars + 1,
                    moveStarTo: newStarSpace.id,
                    message: 'You bought a star for 20 coins!'
                };
            }
            return {
                message: 'You need 20 coins to buy a star!'
            };
        }
    }
};

// Board Themes Configuration
export const BOARD_THEMES = {
    JUNGLE_ADVENTURE: {
        id: 'jungle',
        name: 'Jungle Adventure',
        background: 'from-green-800 to-green-600',
        spaceModifiers: {
            blue: 1.2,
            event: 1.5,
            warp: 0.8
        },
        ambientEffects: ['vines', 'mist', 'wildlife']
    },
    SPACE_STATION: {
        id: 'space',
        name: 'Space Station',
        background: 'from-gray-900 to-blue-900',
        spaceModifiers: {
            warp: 2.0,
            minigame: 1.5,
            red: 0.7
        },
        ambientEffects: ['stars', 'nebula', 'asteroids']
    },
    MEDIEVAL_CASTLE: {
        id: 'castle',
        name: 'Medieval Castle',
        background: 'from-stone-700 to-stone-600',
        spaceModifiers: {
            shop: 1.5,
            star: 1.3,
            blue: 0.9
        },
        ambientEffects: ['torches', 'flags', 'knights']
    },
    UNDERWATER_CITY: {
        id: 'underwater',
        name: 'Underwater City',
        background: 'from-blue-700 to-cyan-600',
        spaceModifiers: {
            blue: 1.5,
            warp: 1.2,
            red: 0.5
        },
        ambientEffects: ['bubbles', 'fish', 'coral']
    }
};

// Enhanced Board Generator Class
export class EnhancedBoardGenerator {
    constructor(theme = BOARD_THEMES.JUNGLE_ADVENTURE) {
        this.theme = theme;
        this.spaceTypes = Object.values(SPACE_TYPES);
    }

    // Generate a massive board that supports 200+ players
    generateMassiveBoard(width = 100, height = 100, playerCount = 200) {
        console.log('Starting board generation with dimensions:', width, 'x', height);

        const spaces = [];
        const spawnZones = [];

        // For now, let's create a simple grid of spaces to test
        // We'll make it smaller for initial testing (10x10 = 100 spaces)
        const actualWidth = Math.min(width, 10);
        const actualHeight = Math.min(height, 10);
        let idCounter = 0;

        // Create a grid of spaces
        for (let y = 0; y < actualHeight; y++) {
            for (let x = 0; x < actualWidth; x++) {
                // Create spaces in a checkerboard pattern to ensure connectivity
                if ((x + y) % 2 === 0 || Math.random() < 0.7) {
                    const space = this.createSpace(idCounter++, x, y);
                    spaces.push(space);
                }
            }
        }

        // Connect adjacent spaces
        this.connectSpaces(spaces);

        // Create spawn zones (4 corners for now)
        spawnZones.push({ x: 0, y: 0 });
        spawnZones.push({ x: actualWidth - 1, y: 0 });
        spawnZones.push({ x: 0, y: actualHeight - 1 });
        spawnZones.push({ x: actualWidth - 1, y: actualHeight - 1 });

        console.log('Board generated with', spaces.length, 'spaces');

        return {
            spaces,
            width: actualWidth,
            height: actualHeight,
            spawnZones,
            theme: this.theme
        };
    }

    createSpace(id, x, y) {
        const spaceType = this.selectSpaceType();
        return {
            id,
            x,
            y,
            type: spaceType.id,
            name: `${spaceType.name} ${id}`,
            connections: [],
            players: [],
            items: [],
            effects: []
        };
    }

    selectSpaceType() {
        const modifiedWeights = this.spaceTypes.map(type => ({
            ...type,
            weight: type.weight * (this.theme.spaceModifiers[type.id.toLowerCase()] || 1)
        }));

        const totalWeight = modifiedWeights.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;

        for (const type of modifiedWeights) {
            random -= type.weight;
            if (random <= 0) {
                return type;
            }
        }

        return this.spaceTypes[0]; // Default to first type
    }

    connectSpaces(spaces) {
        // Create a map for quick lookup
        const spaceMap = new Map();
        spaces.forEach(space => {
            const key = `${space.x},${space.y}`;
            spaceMap.set(key, space);
        });

        // Connect each space to its neighbors
        spaces.forEach(space => {
            const neighbors = [
                { x: space.x - 1, y: space.y },     // left
                { x: space.x + 1, y: space.y },     // right
                { x: space.x, y: space.y - 1 },     // up
                { x: space.x, y: space.y + 1 },     // down
            ];

            neighbors.forEach(neighbor => {
                const key = `${neighbor.x},${neighbor.y}`;
                const neighborSpace = spaceMap.get(key);

                if (neighborSpace && !space.connections.includes(neighborSpace.id)) {
                    space.connections.push(neighborSpace.id);
                }
            });
        });
    }

    // Stub methods for full implementation later
    createSpawnZones(width, height, playerCount) {
        const zones = [];
        const gridSize = Math.ceil(Math.sqrt(playerCount));

        for (let i = 0; i < Math.min(playerCount, 4); i++) {
            zones.push({
                x: (i % 2) * (width - 1),
                y: Math.floor(i / 2) * (height - 1)
            });
        }

        return zones;
    }

    generateMainPaths(width, height, spawnZones) {
        // Simple implementation - just return spawn zones as paths for now
        return spawnZones.map(zone => [zone]);
    }
}

// Board Manager for handling board state and player interactions
export class BoardManager {
    constructor(board) {
        this.board = board;
        this.playerPositions = new Map(); // playerId -> spaceId
        this.spaceEffects = new Map(); // spaceId -> active effects
        this.starLocations = new Set(); // Track current star space locations

        // Initialize star locations
        board.spaces.filter(s => s.type === 'star').forEach(s => {
            this.starLocations.add(s.id);
        });
    }

    // Handle player landing on a space
    async handleSpaceLanding(playerId, spaceId, gameState) {
        const space = this.board.spaces.find(s => s.id === spaceId);
        const player = gameState.players.find(p => p.id === playerId);

        if (!space || !player) return null;

        const spaceType = SPACE_TYPES[space.type.toUpperCase()];
        if (!spaceType) return null;

        // Execute space action
        const result = await spaceType.action(player, this.board);

        // Handle special results
        if (result.moveStarTo) {
            this.moveStarSpace(space.id, result.moveStarTo);
        }

        if (result.triggerWarp) {
            const warpResult = SPACE_TYPES.WARP.action(player, this.board);
            result.position = warpResult.position;
            result.message += ' ' + warpResult.message;
        }

        return result;
    }

    // Move star space to new location
    moveStarSpace(fromSpaceId, toSpaceId) {
        const fromSpace = this.board.spaces.find(s => s.id === fromSpaceId);
        const toSpace = this.board.spaces.find(s => s.id === toSpaceId);

        if (fromSpace && toSpace && toSpace.type !== 'star') {
            fromSpace.type = 'blue'; // Convert old star space to blue
            fromSpace.name = `Blue Space ${fromSpace.id}`;

            toSpace.type = 'star';
            toSpace.name = `Star Space ${toSpace.id}`;

            this.starLocations.delete(fromSpaceId);
            this.starLocations.add(toSpaceId);
        }
    }

    // Get valid moves for a player
    getValidMoves(playerId, diceRoll) {
        const currentPosition = this.playerPositions.get(playerId);
        const currentSpace = this.board.spaces.find(s => s.id === currentPosition);

        if (!currentSpace) return [];

        // Use pathfinding to find all spaces exactly diceRoll moves away
        const validMoves = [];
        const visited = new Set();
        const queue = [{ space: currentSpace, distance: 0, path: [currentSpace.id] }];

        while (queue.length > 0) {
            const { space, distance, path } = queue.shift();

            if (distance === diceRoll) {
                validMoves.push({
                    spaceId: space.id,
                    path: path
                });
                continue;
            }

            if (distance < diceRoll) {
                space.connections.forEach(connectionId => {
                    const key = `${connectionId}-${distance + 1}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        const nextSpace = this.board.spaces.find(s => s.id === connectionId);
                        if (nextSpace) {
                            queue.push({
                                space: nextSpace,
                                distance: distance + 1,
                                path: [...path, connectionId]
                            });
                        }
                    }
                });
            }
        }

        return validMoves;
    }

    // Update player position
    updatePlayerPosition(playerId, newSpaceId) {
        const oldSpaceId = this.playerPositions.get(playerId);

        // Remove from old space
        if (oldSpaceId !== undefined) {
            const oldSpace = this.board.spaces.find(s => s.id === oldSpaceId);
            if (oldSpace) {
                oldSpace.players = oldSpace.players.filter(id => id !== playerId);
            }
        }

        // Add to new space
        const newSpace = this.board.spaces.find(s => s.id === newSpaceId);
        if (newSpace) {
            if (!newSpace.players) newSpace.players = [];
            newSpace.players.push(playerId);
            this.playerPositions.set(playerId, newSpaceId);
        }
    }

    // Get board state for a specific viewport (for rendering optimization)
    getViewportSpaces(centerX, centerY, radius) {
        return this.board.spaces.filter(space => {
            const distance = Math.sqrt(
                Math.pow(space.x - centerX, 2) +
                Math.pow(space.y - centerY, 2)
            );
            return distance <= radius;
        });
    }

    // Serialize board state for network transmission
    serializeBoardState() {
        return {
            theme: this.board.theme,
            width: this.board.width,
            height: this.board.height,
            spaces: this.board.spaces.map(space => ({
                id: space.id,
                x: space.x,
                y: space.y,
                type: space.type,
                name: space.name,
                connections: space.connections,
                players: space.players,
                isShortcut: space.isShortcut,
                special: {
                    warpPartner: space.warpPartner,
                    bubbleStream: space.bubbleStream,
                    streamDirection: space.streamDirection,
                    gravityWell: space.gravityWell,
                    pullStrength: space.pullStrength
                }
            })),
            starLocations: Array.from(this.starLocations)
        };
    }
}