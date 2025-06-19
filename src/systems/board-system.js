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
        const spaces = [];
        const totalSpaces = Math.floor(width * height * 0.3); // 30% density
        const spacesPerPlayer = Math.ceil(totalSpaces / playerCount);

        // Create spawn zones for players
        const spawnZones = this.createSpawnZones(width, height, playerCount);

        // Generate main paths connecting spawn zones
        const mainPaths = this.generateMainPaths(width, height, spawnZones);

        // Place spaces along paths
        let idCounter = 0;
        mainPaths.forEach(path => {
            path.forEach((coord, index) => {
                if (index % 2 === 0) { // Place space every other coordinate
                    const space = this.createSpace(idCounter++, coord.x, coord.y);
                    spaces.push(space);
                }
            });
        });

        // Add branching paths
        const branches = this.generateBranchingPaths(spaces, width, height);
        branches.forEach(coord => {
            const space = this.createSpace(idCounter++, coord.x, coord.y);
            spaces.push(space);
        });

        // Connect adjacent spaces
        this.connectSpaces(spaces);

        // Add special features
        this.addStarSpaces(spaces, playerCount);
        this.addWarpPairs(spaces);
        this.addShortcuts(spaces);

        // Apply theme modifiers
        this.applyThemeModifiers(spaces);

        return {
            spaces,
            width,
            height,
            theme: this.theme,
            playerCapacity: playerCount,
            spawnZones
        };
    }

    createSpawnZones(width, height, playerCount) {
        const zones = [];
        const zonesNeeded = Math.ceil(playerCount / 25); // 25 players per zone
        const cols = Math.ceil(Math.sqrt(zonesNeeded));
        const rows = Math.ceil(zonesNeeded / cols);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (zones.length < zonesNeeded) {
                    zones.push({
                        x: Math.floor((c + 0.5) * (width / cols)),
                        y: Math.floor((r + 0.5) * (height / rows)),
                        id: zones.length
                    });
                }
            }
        }

        return zones;
    }

    generateMainPaths(width, height, spawnZones) {
        const paths = [];

        // Connect spawn zones in a web pattern
        for (let i = 0; i < spawnZones.length; i++) {
            for (let j = i + 1; j < spawnZones.length; j++) {
                if (Math.random() < 0.6) { // 60% chance to connect
                    const path = this.createPath(
                        spawnZones[i].x, spawnZones[i].y,
                        spawnZones[j].x, spawnZones[j].y,
                        width, height
                    );
                    paths.push(path);
                }
            }
        }

        return paths;
    }

    createPath(x1, y1, x2, y2, maxWidth, maxHeight) {
        const path = [];
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(x1 + (x2 - x1) * t);
            const y = Math.round(y1 + (y2 - y1) * t);

            // Add some randomness to make paths more interesting
            const offsetX = Math.floor(Math.random() * 5 - 2);
            const offsetY = Math.floor(Math.random() * 5 - 2);

            const finalX = Math.max(0, Math.min(maxWidth - 1, x + offsetX));
            const finalY = Math.max(0, Math.min(maxHeight - 1, y + offsetY));

            path.push({ x: finalX, y: finalY });
        }

        return path;
    }

    generateBranchingPaths(existingSpaces, width, height) {
        const branches = [];
        const grid = this.createGrid(width, height, existingSpaces);

        existingSpaces.forEach(space => {
            if (Math.random() < 0.3) { // 30% chance to branch
                const branchLength = Math.floor(Math.random() * 10) + 5;
                const angle = Math.random() * Math.PI * 2;

                for (let i = 1; i <= branchLength; i++) {
                    const x = Math.round(space.x + Math.cos(angle) * i);
                    const y = Math.round(space.y + Math.sin(angle) * i);

                    if (x >= 0 && x < width && y >= 0 && y < height && grid[y] && grid[y][x] !== undefined && !grid[y][x]) {
                        branches.push({ x, y });
                        grid[y][x] = true;
                    }
                }
            }
        });

        return branches;
    }

    createGrid(width, height, spaces) {
        const grid = Array(height).fill(null).map(() => Array(width).fill(false));
        spaces.forEach(space => {
            if (space.y >= 0 && space.y < height && space.x >= 0 && space.x < width) {
                grid[space.y][space.x] = true;
            }
        });
        return grid;
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
            players: [], // Track multiple players on same space
            items: [], // Items that can be picked up
            effects: [] // Active effects on this space
        };
    }

    selectSpaceType() {
        const modifiedWeights = this.spaceTypes.map(type => ({
            ...type,
            weight: type.weight * (this.theme.spaceModifiers[type.id] || 1)
        }));

        const totalWeight = modifiedWeights.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;

        for (const type of modifiedWeights) {
            random -= type.weight;
            if (random <= 0) {
                return type;
            }
        }

        return modifiedWeights[0];
    }

    connectSpaces(spaces) {
        const maxDistance = 3;

        spaces.forEach(space => {
            const nearbySpaces = spaces.filter(other => {
                if (other.id === space.id) return false;
                const distance = Math.sqrt(
                    Math.pow(other.x - space.x, 2) +
                    Math.pow(other.y - space.y, 2)
                );
                return distance <= maxDistance;
            });

            // Connect to 2-4 nearby spaces
            const connectionCount = Math.min(nearbySpaces.length, 2 + Math.floor(Math.random() * 3));
            nearbySpaces.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.x - space.x, 2) + Math.pow(a.y - space.y, 2));
                const distB = Math.sqrt(Math.pow(b.x - space.x, 2) + Math.pow(b.y - space.y, 2));
                return distA - distB;
            });

            for (let i = 0; i < connectionCount; i++) {
                const other = nearbySpaces[i];
                if (!space.connections.includes(other.id)) {
                    space.connections.push(other.id);
                }
                if (!other.connections.includes(space.id)) {
                    other.connections.push(space.id);
                }
            }
        });
    }

    addStarSpaces(spaces, playerCount) {
        const starCount = Math.ceil(playerCount / 20); // 1 star per 20 players
        const candidates = spaces.filter(s => s.type !== 'star');

        for (let i = 0; i < starCount && candidates.length > 0; i++) {
            const index = Math.floor(Math.random() * candidates.length);
            const space = candidates.splice(index, 1)[0];
            space.type = 'star';
            space.name = `Star Space ${space.id}`;
        }
    }

    addWarpPairs(spaces) {
        const warpSpaces = spaces.filter(s => s.type === 'warp');

        // Ensure warp spaces come in pairs
        for (let i = 0; i < warpSpaces.length - 1; i += 2) {
            const warp1 = warpSpaces[i];
            const warp2 = warpSpaces[i + 1];

            if (warp1 && warp2) {
                warp1.warpPartner = warp2.id;
                warp2.warpPartner = warp1.id;
            }
        }
    }

    addShortcuts(spaces) {
        const shortcutCount = Math.floor(spaces.length / 50);

        for (let i = 0; i < shortcutCount; i++) {
            const space1 = spaces[Math.floor(Math.random() * spaces.length)];
            const space2 = spaces[Math.floor(Math.random() * spaces.length)];

            const distance = Math.sqrt(
                Math.pow(space2.x - space1.x, 2) +
                Math.pow(space2.y - space1.y, 2)
            );

            // Only create shortcuts for spaces that are far apart
            if (distance > 20 && !space1.connections.includes(space2.id)) {
                space1.connections.push(space2.id);
                space2.connections.push(space1.id);
                space1.isShortcut = true;
                space2.isShortcut = true;
            }
        }
    }

    applyThemeModifiers(spaces) {
        // Add theme-specific features
        if (this.theme.id === 'underwater') {
            // Add bubble streams that act as one-way paths
            spaces.forEach(space => {
                if (Math.random() < 0.1 && space.connections && space.connections.length > 0) {
                    space.bubbleStream = true;
                    space.streamDirection = Math.floor(Math.random() * space.connections.length);
                }
            });
        } else if (this.theme.id === 'space') {
            // Add gravity wells that pull players
            spaces.forEach(space => {
                if (Math.random() < 0.05) {
                    space.gravityWell = true;
                    space.pullStrength = Math.floor(Math.random() * 3) + 1;
                }
            });
        }
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