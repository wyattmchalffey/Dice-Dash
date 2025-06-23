// src/systems/party-board-manager.js
// Refactored board manager for standard-sized Mario Party-style boards

import { BoardGenerator, BOARD_THEMES } from './board-system';

export class BoardManager {
    constructor() {
        this.boards = new Map();
        this.gameInstances = new Map();
        this.playerPositions = new Map();
        this.gameStats = new Map();
        this.generators = new Map();
        
        // Initialize generators for each theme
        Object.values(BOARD_THEMES).forEach(theme => {
            this.generators.set(theme.id, new BoardGenerator(theme));
        });
    }

    // Create a new standard board instance
    createBoard(gameId, themeId = 'classic_plains', playerCount = 4) {
        console.log(`Creating board for game ${gameId} with theme ${themeId}`);
        
        const generator = this.generators.get(themeId);
        if (!generator) {
            throw new Error(`Unknown theme: ${themeId}`);
        }

        const board = generator.generateBoard(playerCount);
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
                maxTurns: 20, // Standard game length
                turnTimeLimit: 60000, // 1 minute per turn
                maxPlayers: 8
            }
        };

        this.gameInstances.set(gameId, gameInstance);
        this.gameStats.set(gameId, {
            totalMoves: 0,
            spacesLanded: new Map(),
            playersJoined: 0,
            gameStarted: false,
            gameEnded: false
        });

        return board;
    }

    // Get board for a game
    getBoard(gameId) {
        return this.boards.get(gameId);
    }

    // Get game instance
    getGameInstance(gameId) {
        return this.gameInstances.get(gameId);
    }

    // Add player to board
    addPlayer(gameId, player) {
        const gameInstance = this.gameInstances.get(gameId);
        const board = this.boards.get(gameId);
        
        if (!gameInstance || !board) {
            throw new Error(`Game ${gameId} not found`);
        }

        // Check player limit
        if (gameInstance.players.size >= board.maxPlayers) {
            throw new Error('Game is full');
        }

        // Add player to game
        gameInstance.players.set(player.userId, {
            ...player,
            position: 0, // Start at space 0
            coins: 10,   // Starting coins
            stars: 0,    // Starting stars
            items: [],   // Starting items
            joinTime: Date.now()
        });

        // Set initial position
        this.playerPositions.set(player.userId, 0);

        // Add to turn order if not already there
        if (!gameInstance.turnOrder.includes(player.userId)) {
            gameInstance.turnOrder.push(player.userId);
        }

        // Update stats
        const stats = this.gameStats.get(gameId);
        stats.playersJoined = gameInstance.players.size;

        console.log(`Player ${player.displayName} added to game ${gameId}`);
        return true;
    }

    // Remove player from board
    removePlayer(gameId, userId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) return false;

        gameInstance.players.delete(userId);
        this.playerPositions.delete(userId);
        
        // Remove from turn order
        const turnIndex = gameInstance.turnOrder.indexOf(userId);
        if (turnIndex !== -1) {
            gameInstance.turnOrder.splice(turnIndex, 1);
        }

        // Update current turn if necessary
        if (gameInstance.currentTurn >= gameInstance.turnOrder.length) {
            gameInstance.currentTurn = 0;
        }

        console.log(`Player ${userId} removed from game ${gameId}`);
        return true;
    }

    // Move player to a specific space
    movePlayer(gameId, userId, targetSpaceId) {
        const board = this.boards.get(gameId);
        const gameInstance = this.gameInstances.get(gameId);
        
        if (!board || !gameInstance) {
            throw new Error(`Game ${gameId} not found`);
        }

        const player = gameInstance.players.get(userId);
        if (!player) {
            throw new Error(`Player ${userId} not found in game`);
        }

        const targetSpace = board.spaces.find(space => space.id === targetSpaceId);
        if (!targetSpace) {
            throw new Error(`Space ${targetSpaceId} not found`);
        }

        // Update player position
        player.position = targetSpaceId;
        this.playerPositions.set(userId, targetSpaceId);

        // Update stats
        const stats = this.gameStats.get(gameId);
        stats.totalMoves++;
        
        const spaceCount = stats.spacesLanded.get(targetSpace.type) || 0;
        stats.spacesLanded.set(targetSpace.type, spaceCount + 1);

        console.log(`Player ${userId} moved to space ${targetSpaceId} (${targetSpace.type})`);
        
        return {
            newPosition: targetSpaceId,
            spaceType: targetSpace.type,
            spaceEffect: this.getSpaceEffect(targetSpace, player)
        };
    }

    // Get valid moves for a player
    getValidMoves(gameId, userId, diceRoll) {
        const board = this.boards.get(gameId);
        const currentPosition = this.playerPositions.get(userId);
        
        if (!board || currentPosition === undefined) {
            return [];
        }

        const currentSpace = board.spaces.find(space => space.id === currentPosition);
        if (!currentSpace) {
            return [];
        }

        // For standard boards, movement is simple linear progression
        const validMoves = [];
        let movesRemaining = diceRoll;
        let currentSpaceId = currentPosition;

        while (movesRemaining > 0) {
            const space = board.spaces.find(s => s.id === currentSpaceId);
            if (!space || space.connections.length === 0) break;

            // For main path, take the first connection (forward movement)
            // For branches, player can choose direction
            const nextSpaceId = space.connections[0];
            validMoves.push(nextSpaceId);
            
            currentSpaceId = nextSpaceId;
            movesRemaining--;
        }

        return validMoves;
    }

    // Get space effect when player lands on it
    getSpaceEffect(space, player) {
        const effects = [];

        switch (space.type) {
            case 'BLUE':
                effects.push({
                    type: 'coins',
                    amount: 3,
                    message: 'Gained 3 coins!'
                });
                player.coins += 3;
                break;

            case 'RED':
                const coinsToLose = Math.min(3, player.coins);
                effects.push({
                    type: 'coins',
                    amount: -coinsToLose,
                    message: `Lost ${coinsToLose} coins!`
                });
                player.coins -= coinsToLose;
                break;

            case 'GREEN':
                effects.push({
                    type: 'event',
                    message: 'Something happens!',
                    eventType: 'random'
                });
                break;

            case 'STAR':
                if (player.coins >= 20) {
                    effects.push({
                        type: 'star_option',
                        cost: 20,
                        message: 'Buy a star for 20 coins?'
                    });
                } else {
                    effects.push({
                        type: 'message',
                        message: 'Not enough coins for a star!'
                    });
                }
                break;

            case 'CHANCE':
                effects.push({
                    type: 'minigame',
                    gameType: 'chance_time',
                    message: 'Chance Time!'
                });
                break;

            case 'SHOP':
                effects.push({
                    type: 'shop',
                    message: 'Welcome to the shop!',
                    items: space.special?.shopItems || []
                });
                break;

            default:
                effects.push({
                    type: 'message',
                    message: 'Nothing happens...'
                });
        }

        return effects;
    }

    // Get current player whose turn it is
    getCurrentPlayer(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance || gameInstance.turnOrder.length === 0) {
            return null;
        }

        const currentUserId = gameInstance.turnOrder[gameInstance.currentTurn];
        return gameInstance.players.get(currentUserId);
    }

    // Advance to next player's turn
    nextTurn(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) {
            throw new Error(`Game ${gameId} not found`);
        }

        gameInstance.currentTurn = (gameInstance.currentTurn + 1) % gameInstance.turnOrder.length;
        
        return this.getCurrentPlayer(gameId);
    }

    // Start the game
    startGame(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        if (!gameInstance) {
            throw new Error(`Game ${gameId} not found`);
        }

        if (gameInstance.players.size < 2) {
            throw new Error('Need at least 2 players to start');
        }

        gameInstance.gameState = 'active';
        gameInstance.currentTurn = 0;
        
        const stats = this.gameStats.get(gameId);
        stats.gameStarted = true;

        console.log(`Game ${gameId} started with ${gameInstance.players.size} players`);
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
            turnOrder: gameInstance.turnOrder
        };
    }

    // Clean up board and game data
    destroyBoard(gameId) {
        this.boards.delete(gameId);
        this.gameInstances.delete(gameId);
        this.gameStats.delete(gameId);
        
        console.log(`Board ${gameId} destroyed`);
    }

    // Get all available themes
    getAvailableThemes() {
        return Object.values(BOARD_THEMES);
    }

    // Get player position
    getPlayerPosition(userId) {
        return this.playerPositions.get(userId);
    }

    // Check if game is full
    isGameFull(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        const board = this.boards.get(gameId);
        
        if (!gameInstance || !board) {
            return false;
        }

        return gameInstance.players.size >= board.maxPlayers;
    }

    // Get game state
    getGameState(gameId) {
        const gameInstance = this.gameInstances.get(gameId);
        return gameInstance?.gameState || 'not_found';
    }
}

export { BOARD_THEMES } from './board-system';