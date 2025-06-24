// src/systems/board-manager.js
// Simplified board manager for single magical kingdom theme

import { BoardGenerator, BOARD_THEMES } from './board-system';

export class BoardManager {
    constructor() {
        this.boards = new Map();
        this.gameInstances = new Map();
        this.playerPositions = new Map();
        this.gameStats = new Map();
        
        // Only one theme - Magical Kingdom
        this.generator = new BoardGenerator(BOARD_THEMES.MAGICAL_KINGDOM);
    }

    // Create a new board instance (always magical kingdom)
    createBoard(gameId, themeId = 'magical_kingdom', playerCount = 4) {
        console.log(`Creating Magical Kingdom board for game ${gameId}`);
        
        // Always use magical kingdom theme
        const board = this.generator.generateBoard(playerCount);
        this.boards.set(gameId, board);

        // Initialize game instance
        const gameInstance = {
            gameId,
            board,
            players: new Map(),
            currentTurn: 0,
            turnOrder: [],
            gameState: 'waiting',
            startTime: Date.now(),
            settings: {
                maxTurns: 30,
                turnTimeLimit: 60000,
                maxPlayers: 8,
                starCost: 20,
                initialCoins: 10,
                coinsPerBlueSpace: 3,
                coinsPerRedSpace: -3
            },
            // Track special game events
            events: {
                starsCollected: 0,
                minigamesPlayed: 0,
                totalCoinsEarned: 0,
                totalCoinsLost: 0,
                warpsUsed: 0,
                itemsUsed: 0
            }
        };

        this.gameInstances.set(gameId, gameInstance);
        
        // Initialize game statistics
        this.gameStats.set(gameId, {
            totalMoves: 0,
            spacesLanded: new Map(),
            playersJoined: 0,
            gameStarted: false,
            gameEnded: false,
            gameHistory: [],
            achievements: []
        });

        return board;
    }

    // Get current player
    getCurrentPlayer(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance || gameInstance.turnOrder.length === 0) {
            return null;
        }

        const currentUserId = gameInstance.turnOrder[gameInstance.currentTurn];
        return gameInstance.players.get(currentUserId) || null;
    }

    // Get next player in turn order
    getNextPlayer(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance || gameInstance.turnOrder.length === 0) {
            return null;
        }

        const nextTurn = (gameInstance.currentTurn + 1) % gameInstance.turnOrder.length;
        const nextUserId = gameInstance.turnOrder[nextTurn];
        return gameInstance.players.get(nextUserId) || null;
    }

    // Advance to next turn
    advanceTurn(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) return false;

        gameInstance.currentTurn = (gameInstance.currentTurn + 1) % gameInstance.turnOrder.length;

        // Add to game history
        const stats = this.gameStats.get(gameId);
        if (stats && stats.gameHistory) {
            stats.gameHistory.push({
                event: 'turn_advanced',
                turn: gameInstance.currentTurn,
                timestamp: Date.now()
            });
        }

        return true;
    }

    // Check if it's a specific player's turn
    isPlayerTurn(gameId, userId) {
        const currentPlayer = this.getCurrentPlayer(gameId);
        return currentPlayer && currentPlayer.userId === userId;
    }

    // Get board for a game
    getBoard(gameId) {
        return this.boards.get(gameId);
    }

    // Get game instance
    getGameInstance(gameId) {
        return this.gameInstances.get(gameId);
    }

    // Add player to board with enhanced visuals
    addPlayer(gameId, player) {
        if (!gameId || !player || !player.userId) {
            console.warn('Invalid player data:', { gameId, player });
            return false;
        }
        
        const gameInstance = this.gameInstances.get(gameId);
        const board = this.boards.get(gameId);
        
        if (!gameInstance || !board) {
            console.warn(`Game ${gameId} not found when adding player`);
            return false;
        }

        if (gameInstance.players.size >= board.maxPlayers) {
            throw new Error('Game is full');
        }

        // Enhanced player data
        gameInstance.players.set(player.userId, {
            userId: player.userId,
            displayName: player.displayName || 'Unknown Player',
            position: 0,
            coins: gameInstance.settings.initialCoins,
            stars: 0,
            items: [],
            joinTime: Date.now(),
            colorIndex: gameInstance.players.size, // For visual representation
            stats: {
                spacesMovedTotal: 0,
                coinsEarnedTotal: 0,
                coinsLostTotal: 0,
                minigamesWon: 0,
                minigamesPlayed: 0,
                itemsUsed: 0
            },
            achievements: [],
            ...player
        });

        this.playerPositions.set(player.userId, 0);

        if (!gameInstance.turnOrder.includes(player.userId)) {
            gameInstance.turnOrder.push(player.userId);
        }

        const stats = this.gameStats.get(gameId);
        if (stats) {
            stats.playersJoined = gameInstance.players.size;
        }

        console.log(`Player ${player.displayName} joined the Magical Kingdom!`);
        return true;
    }

    // Move player with animations and effects
    movePlayer(gameId, userId, spaces) {
        const gameInstance = this.gameInstances.get(gameId);
        const board = this.boards.get(gameId);
        
        if (!gameInstance || !board) return null;
        
        const player = gameInstance.players.get(userId);
        if (!player) return null;
        
        const currentPos = this.playerPositions.get(userId) || 0;
        const boardSpaces = board.spaces;
        const currentSpace = boardSpaces.find(s => s.id === currentPos);
        
        if (!currentSpace) return null;
        
        // Calculate movement path
        const path = this.calculateMovementPath(currentSpace, spaces, boardSpaces);
        
        // Update position
        const finalPosition = path[path.length - 1];
        this.playerPositions.set(userId, finalPosition.id);
        player.position = finalPosition.id;
        
        // Update stats
        player.stats.spacesMovedTotal += spaces;
        
        const stats = this.gameStats.get(gameId);
        if (stats) {
            stats.totalMoves++;
            const landCount = stats.spacesLanded.get(finalPosition.type) || 0;
            stats.spacesLanded.set(finalPosition.type, landCount + 1);
        }
        
        // Return movement data for animation
        return {
            player: player,
            path: path,
            finalSpace: finalPosition,
            effects: this.getMovementEffects(path, finalPosition)
        };
    }

    // Calculate movement path for animation
    calculateMovementPath(startSpace, spacesToMove, allSpaces) {
        const path = [];
        let currentSpace = startSpace;
        let remainingMoves = spacesToMove;
        
        while (remainingMoves > 0 && currentSpace) {
            // Find next space
            const nextSpaceId = currentSpace.connections[0]; // Simple forward movement
            const nextSpace = allSpaces.find(s => s.id === nextSpaceId);
            
            if (nextSpace) {
                path.push(nextSpace);
                currentSpace = nextSpace;
                remainingMoves--;
            } else {
                break;
            }
        }
        
        return path;
    }

    // Get visual effects for movement
    getMovementEffects(path, finalSpace) {
        const effects = [];
        
        // Trail effect along path
        effects.push({
            type: 'trail',
            path: path.map(s => ({ x: s.x, y: s.y })),
            color: '#fbbf24',
            duration: 1000
        });
        
        // Landing effect based on space type
        const landingEffects = {
            'STAR': { type: 'starburst', color: '#fbbf24', particles: 20 },
            'SHOP': { type: 'coins', color: '#f59e0b', particles: 10 },
            'CHANCE': { type: 'swirl', color: '#8b5cf6', particles: 15 },
            'WARP': { type: 'portal', color: '#14b8a6', particles: 25 },
            'GREEN': { type: 'bounce', color: '#10b981', particles: 12 },
            'RED': { type: 'shake', color: '#ef4444', particles: 8 },
            'BLUE': { type: 'sparkle', color: '#3b82f6', particles: 10 }
        };
        
        const landEffect = landingEffects[finalSpace.type] || landingEffects['BLUE'];
        effects.push({
            ...landEffect,
            x: finalSpace.x,
            y: finalSpace.y,
            delay: 500
        });
        
        return effects;
    }

    // Handle landing on space
    handleSpaceLanding(gameId, userId, space) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) return null;
        
        const player = gameInstance.players.get(userId);
        if (!player) return null;
        
        const results = {
            type: space.type,
            effects: [],
            changes: {}
        };
        
        switch (space.type) {
            case 'BLUE':
                player.coins += gameInstance.settings.coinsPerBlueSpace;
                player.stats.coinsEarnedTotal += gameInstance.settings.coinsPerBlueSpace;
                results.changes.coins = gameInstance.settings.coinsPerBlueSpace;
                results.effects.push({ type: 'coin_gain', amount: gameInstance.settings.coinsPerBlueSpace });
                break;
                
            case 'RED':
                const loss = Math.min(player.coins, Math.abs(gameInstance.settings.coinsPerRedSpace));
                player.coins -= loss;
                player.stats.coinsLostTotal += loss;
                results.changes.coins = -loss;
                results.effects.push({ type: 'coin_loss', amount: loss });
                break;
                
            case 'STAR':
                if (player.coins >= gameInstance.settings.starCost) {
                    results.canBuyStar = true;
                    results.starCost = gameInstance.settings.starCost;
                }
                break;
                
            case 'SHOP':
                results.shopAvailable = true;
                results.items = this.getShopItems();
                break;
                
            case 'CHANCE':
                results.chanceEvent = this.triggerChanceEvent(player);
                break;
                
            case 'WARP':
                results.warpAvailable = true;
                results.warpTargets = this.getWarpTargets(space, gameInstance.board.spaces);
                break;
                
            case 'GREEN':
                results.event = this.triggerRandomEvent(player, gameInstance);
                break;
                
            case 'HAPPENING':
                results.miniGame = {
                    type: 'random',
                    players: this.getMinigamePlayers(gameInstance)
                };
                break;
        }
        
        // Update game events
        if (gameInstance.events) {
            if (results.changes.coins > 0) {
                gameInstance.events.totalCoinsEarned += results.changes.coins;
            } else if (results.changes.coins < 0) {
                gameInstance.events.totalCoinsLost += Math.abs(results.changes.coins);
            }
        }
        
        return results;
    }

    // Get available shop items
    getShopItems() {
        return [
            {
                id: 'double_dice',
                name: 'Double Dice',
                cost: 15,
                description: 'Roll two dice on your next turn',
                icon: '🎲🎲'
            },
            {
                id: 'coin_magnet',
                name: 'Coin Magnet',
                cost: 10,
                description: 'Double coins from blue spaces for 3 turns',
                icon: '🧲'
            },
            {
                id: 'star_discount',
                name: 'Star Discount',
                cost: 12,
                description: 'Next star costs 10 coins instead of 20',
                icon: '💫'
            },
            {
                id: 'warp_pipe',
                name: 'Warp Pipe',
                cost: 8,
                description: 'Teleport to any space on your next turn',
                icon: '🌀'
            }
        ];
    }

    // Trigger chance event
    triggerChanceEvent(player) {
        const events = [
            {
                id: 'coin_bonus',
                description: 'Lucky! Gain 10 coins!',
                effect: () => {
                    player.coins += 10;
                    player.stats.coinsEarnedTotal += 10;
                    return { coins: 10 };
                }
            },
            {
                id: 'coin_penalty',
                description: 'Unlucky! Lose 5 coins!',
                effect: () => {
                    const loss = Math.min(player.coins, 5);
                    player.coins -= loss;
                    player.stats.coinsLostTotal += loss;
                    return { coins: -loss };
                }
            },
            {
                id: 'teleport',
                description: 'Magical teleportation!',
                effect: () => {
                    return { teleport: true };
                }
            },
            {
                id: 'item_gift',
                description: 'Receive a random item!',
                effect: () => {
                    const items = this.getShopItems();
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    player.items.push(randomItem.id);
                    return { item: randomItem };
                }
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        const result = event.effect();
        
        return {
            ...event,
            result
        };
    }

    // Trigger random event
    triggerRandomEvent(player, gameInstance) {
        const events = [
            {
                name: 'Coin Shower',
                description: 'Coins rain from the sky!',
                effect: () => {
                    const amount = Math.floor(Math.random() * 10) + 5;
                    player.coins += amount;
                    return { type: 'coin_rain', amount };
                }
            },
            {
                name: 'Star Movement',
                description: 'The star has moved to a new location!',
                effect: () => {
                    // Move star logic here
                    return { type: 'star_move' };
                }
            },
            {
                name: 'Everyone Gets Coins',
                description: 'Everyone receives 5 coins!',
                effect: () => {
                    gameInstance.players.forEach(p => {
                        p.coins += 5;
                    });
                    return { type: 'coin_party', amount: 5 };
                }
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        const result = event.effect();
        
        return {
            ...event,
            result
        };
    }

    // Get warp targets
    getWarpTargets(currentSpace, allSpaces) {
        return allSpaces
            .filter(s => s.type === 'WARP' && s.id !== currentSpace.id)
            .map(s => ({
                id: s.id,
                name: `Warp to ${s.decorations?.[0] || 'Portal'}`,
                x: s.x,
                y: s.y
            }));
    }

    // Get players for minigame
    getMinigamePlayers(gameInstance) {
        return Array.from(gameInstance.players.values())
            .map(p => ({
                userId: p.userId,
                displayName: p.displayName,
                colorIndex: p.colorIndex
            }));
    }

    // Purchase star
    purchaseStar(gameId, userId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) return false;
        
        const player = gameInstance.players.get(userId);
        if (!player || player.coins < gameInstance.settings.starCost) return false;
        
        player.coins -= gameInstance.settings.starCost;
        player.stars += 1;
        
        if (gameInstance.events) {
            gameInstance.events.starsCollected++;
        }
        
        // Check for achievements
        this.checkAchievements(player, gameInstance);
        
        return true;
    }

    // Check for achievements
    checkAchievements(player, gameInstance) {
        const achievements = [];
        
        // First star
        if (player.stars === 1 && !player.achievements.includes('first_star')) {
            player.achievements.push('first_star');
            achievements.push({
                id: 'first_star',
                name: 'Star Collector',
                description: 'Collected your first star!'
            });
        }
        
        // Coin hoarder
        if (player.coins >= 50 && !player.achievements.includes('coin_hoarder')) {
            player.achievements.push('coin_hoarder');
            achievements.push({
                id: 'coin_hoarder',
                name: 'Coin Hoarder',
                description: 'Accumulated 50 coins!'
            });
        }
        
        return achievements;
    }

    // Start the game
    startGame(gameId) {
        if (!gameId) {
            console.warn('Cannot start game: gameId is undefined');
            return false;
        }
        
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) {
            console.warn(`Cannot start game: Game ${gameId} not found`);
            return false;
        }

        if (gameInstance.players.size < 2) {
            throw new Error('Need at least 2 players to start');
        }

        gameInstance.gameState = 'active';
        gameInstance.currentTurn = 0;
        
        const stats = this.gameStats.get(gameId);
        if (stats) {
            stats.gameStarted = true;
            stats.gameHistory.push({
                event: 'game_started',
                timestamp: Date.now(),
                players: gameInstance.players.size
            });
        }

        console.log(`Magical Kingdom adventure begins with ${gameInstance.players.size} players!`);
        return true;
    }

    // Get game statistics
    getGameStats(gameId) {
        const stats = this.gameStats.get(gameId);
        const gameInstance = this.gameInstances.get(gameId);
        
        if (!stats || !gameInstance) {
            return null;
        }

        return {
            ...stats,
            currentPlayers: gameInstance.players.size,
            gameState: gameInstance.gameState,
            currentTurn: gameInstance.currentTurn,
            turnOrder: gameInstance.turnOrder,
            events: gameInstance.events,
            topPlayer: this.getTopPlayer(gameInstance)
        };
    }

    // Get player with most stars
    getTopPlayer(gameInstance) {
        let topPlayer = null;
        let maxStars = -1;
        let maxCoins = -1;
        
        gameInstance.players.forEach(player => {
            if (player.stars > maxStars || 
                (player.stars === maxStars && player.coins > maxCoins)) {
                maxStars = player.stars;
                maxCoins = player.coins;
                topPlayer = player;
            }
        });
        
        return topPlayer;
    }

    // Clean up board and game data
    destroyBoard(gameId) {
        this.boards.delete(gameId);
        this.gameInstances.delete(gameId);
        this.gameStats.delete(gameId);
        
        // Clean up player positions
        const gameInstance = this.gameInstances.get(gameId);
        if (gameInstance) {
            gameInstance.players.forEach((player, userId) => {
                this.playerPositions.delete(userId);
            });
        }
        
        console.log(`Magical Kingdom ${gameId} has been closed`);
    }

    // Get available themes (only one now)
    getAvailableThemes() {
        return [BOARD_THEMES.MAGICAL_KINGDOM];
    }
}

// Export board themes from board-system
export { BOARD_THEMES } from './board-system';