// src/systems/party-board-manager.js
// Main integration system for party-style boards

import { PartyBoardGenerator, PARTY_BOARD_THEMES, PARTY_SPACE_TYPES } from './party-board-system';

export class PartyBoardManager {
    constructor() {
        this.boards = new Map();
        this.playerPositions = new Map();
        this.gameStates = new Map();
        this.starLocations = new Map();
        this.boardGenerator = new PartyBoardGenerator();
        
        this.initializeDefaultBoards();
    }

    // Initialize default themed boards
    initializeDefaultBoards() {
        Object.values(PARTY_BOARD_THEMES).forEach(theme => {
            const generator = new PartyBoardGenerator(theme);
            const board = generator.generatePartyBoard(200);
            this.boards.set(board.id, board);
            console.log(`Initialized party board: ${board.name}`);
        });
    }

    // Create a new game instance on a board
    createGameInstance(gameId, boardThemeId = 'crystal_castle') {
        const boardId = `party_${boardThemeId}`;
        const board = this.boards.get(boardId);
        
        if (!board) {
            throw new Error(`Board not found: ${boardId}`);
        }

        const gameState = {
            gameId,
            boardId,
            players: new Map(),
            turnOrder: [],
            currentPlayerIndex: 0,
            starLocations: new Map(),
            itemShops: new Map(),
            gameEvents: [],
            turnCount: 0,
            gamePhase: 'movement', // movement, minigame, event
            settings: {
                maxTurns: 20,
                starsToWin: 3,
                startingCoins: 10
            }
        };

        // Initialize star locations
        board.starLocations.forEach(star => {
            gameState.starLocations.set(star.id, {
                ...star,
                currentLocation: star.spaceId
            });
        });

        this.gameStates.set(gameId, gameState);
        return gameState;
    }

    // Add player to game
    addPlayerToGame(gameId, player) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) {
            throw new Error(`Game not found: ${gameId}`);
        }

        const board = this.boards.get(gameState.boardId);
        if (!board) {
            throw new Error(`Board not found: ${gameState.boardId}`);
        }

        // Initialize player state
        const playerState = {
            id: player.userId,
            name: player.name,
            color: player.color,
            position: 0, // Start at space 0
            coins: gameState.settings.startingCoins,
            stars: 0,
            items: [],
            status: 'active',
            lastAction: null
        };

        gameState.players.set(player.userId, playerState);
        gameState.turnOrder.push(player.userId);
        
        // Set player position on board
        this.playerPositions.set(player.userId, 0);

        console.log(`Added player ${player.name} to game ${gameId}`);
        return playerState;
    }

    // Get board for game
    getBoardForGame(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        return this.boards.get(gameState.boardId);
    }

    // Get valid moves for player
    getValidMoves(gameId, playerId, diceRoll) {
        const gameState = this.gameStates.get(gameId);
        const board = this.getBoardForGame(gameId);
        
        if (!gameState || !board) return [];

        const playerState = gameState.players.get(playerId);
        if (!playerState) return [];

        const currentSpace = board.spaces.find(s => s.id === playerState.position);
        if (!currentSpace) return [];

        return this.calculateReachableSpaces(board, currentSpace, diceRoll);
    }

    // Calculate reachable spaces from current position
    calculateReachableSpaces(board, startSpace, moves) {
        const reachable = [];
        const visited = new Set();
        
        const explore = (spaceId, movesLeft) => {
            if (movesLeft < 0 || visited.has(spaceId)) return;
            
            visited.add(spaceId);
            
            if (movesLeft === 0) {
                reachable.push(spaceId);
                return;
            }

            const space = board.spaces.find(s => s.id === spaceId);
            if (space && space.connections) {
                space.connections.forEach(connectedId => {
                    explore(connectedId, movesLeft - 1);
                });
            }
        };

        // Start exploration from current space
        startSpace.connections.forEach(connectedId => {
            explore(connectedId, moves - 1);
        });

        return reachable;
    }

    // Move player to new position
    movePlayer(gameId, playerId, newSpaceId) {
        const gameState = this.gameStates.get(gameId);
        const board = this.getBoardForGame(gameId);
        
        if (!gameState || !board) {
            throw new Error('Game or board not found');
        }

        const playerState = gameState.players.get(playerId);
        if (!playerState) {
            throw new Error('Player not found');
        }

        const newSpace = board.spaces.find(s => s.id === newSpaceId);
        if (!newSpace) {
            throw new Error('Invalid space');
        }

        // Update player position
        playerState.position = newSpaceId;
        this.playerPositions.set(playerId, newSpaceId);

        // Trigger space effect
        const spaceEffect = this.triggerSpaceEffect(gameId, playerId, newSpace);

        // Record the move
        playerState.lastAction = {
            type: 'move',
            from: playerState.position,
            to: newSpaceId,
            timestamp: Date.now()
        };

        console.log(`Player ${playerState.name} moved to space ${newSpaceId} (${newSpace.type})`);

        return {
            newPosition: newSpaceId,
            spaceEffect,
            playerState
        };
    }

    // Trigger space effect when player lands
    triggerSpaceEffect(gameId, playerId, space) {
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);
        const spaceType = PARTY_SPACE_TYPES[space.type];

        if (!spaceType || !playerState) {
            return { type: 'none', message: 'No effect' };
        }

        let effect = { type: space.type, message: spaceType.description };

        switch (space.type) {
            case 'BLUE':
                playerState.coins += spaceType.coinEffect;
                effect.message = `Gained ${spaceType.coinEffect} coins!`;
                effect.coins = spaceType.coinEffect;
                break;

            case 'RED':
                const coinsLost = Math.min(Math.abs(spaceType.coinEffect), playerState.coins);
                playerState.coins -= coinsLost;
                effect.message = `Lost ${coinsLost} coins!`;
                effect.coins = -coinsLost;
                break;

            case 'STAR':
                effect = this.handleStarSpace(gameId, playerId);
                break;

            case 'MINIGAME':
                effect = this.handleMinigameSpace(gameId, playerId);
                break;

            case 'GREEN':
                effect = this.handleEventSpace(gameId, playerId);
                break;

            case 'SHOP':
                effect = this.handleShopSpace(gameId, playerId);
                break;

            case 'WARP':
                effect = this.handleWarpSpace(gameId, playerId);
                break;

            case 'CHANCE':
                effect = this.handleChanceSpace(gameId, playerId);
                break;

            case 'VILLAIN':
                effect = this.handleVillainSpace(gameId, playerId);
                break;

            case 'BANK':
                effect = this.handleBankSpace(gameId, playerId);
                break;

            default:
                effect.message = 'Nothing happens...';
        }

        // Add to game events log
        gameState.gameEvents.push({
            type: 'space_effect',
            playerId,
            spaceId: space.id,
            spaceType: space.type,
            effect,
            timestamp: Date.now()
        });

        return effect;
    }

    // Handle star space
    handleStarSpace(gameId, playerId) {
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);

        if (playerState.coins >= 20) {
            playerState.coins -= 20;
            playerState.stars += 1;
            
            // Move star to new location
    moveStarToNewLocation(gameId) {
        const gameState = this.gameStates.get(gameId);
        const board = this.getBoardForGame(gameId);
        
        if (!gameState || !board) return;

        // Get all possible star locations (excluding current ones)
        const currentStarSpaces = Array.from(gameState.starLocations.values()).map(star => star.currentLocation);
        const possibleLocations = board.starLocations.filter(loc => !currentStarSpaces.includes(loc.spaceId));

        if (possibleLocations.length > 0) {
            const newLocation = possibleLocations[Math.floor(Math.random() * possibleLocations.length)];
            
            // Find an available star to move
            const starToMove = Array.from(gameState.starLocations.values())[0];
            if (starToMove) {
                starToMove.currentLocation = newLocation.spaceId;
                console.log(`Star moved to space ${newLocation.spaceId}`);
            }
        }
    }

    // Get nearby players for minigames
    getNearbyPlayers(gameId, playerId, radius = 3) {
        const gameState = this.gameStates.get(gameId);
        const board = this.getBoardForGame(gameId);
        
        if (!gameState || !board) return [];

        const playerState = gameState.players.get(playerId);
        if (!playerState) return [];

        const playerSpace = board.spaces.find(s => s.id === playerState.position);
        const nearbyPlayers = [];

        gameState.players.forEach((otherPlayer, otherPlayerId) => {
            if (otherPlayerId === playerId) return;

            const otherSpace = board.spaces.find(s => s.id === otherPlayer.position);
            if (otherSpace) {
                const distance = this.calculateSpaceDistance(playerSpace, otherSpace);
                if (distance <= radius) {
                    nearbyPlayers.push({
                        id: otherPlayerId,
                        name: otherPlayer.name,
                        distance
                    });
                }
            }
        });

        return nearbyPlayers;
    }

    // Calculate distance between spaces
    calculateSpaceDistance(space1, space2) {
        const dx = space1.x - space2.x;
        const dy = space1.y - space2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Advance to next player's turn
    nextTurn(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.turnOrder.length;
        
        // If back to first player, increment turn count
        if (gameState.currentPlayerIndex === 0) {
            gameState.turnCount += 1;
        }

        const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
        return gameState.players.get(currentPlayerId);
    }

    // Get current player
    getCurrentPlayer(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        const currentPlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
        return gameState.players.get(currentPlayerId);
    }

    // Check win condition
    checkWinCondition(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        // Check if someone has enough stars
        let winner = null;
        gameState.players.forEach((player, playerId) => {
            if (player.stars >= gameState.settings.starsToWin) {
                winner = player;
            }
        });

        // Check if max turns reached
        if (!winner && gameState.turnCount >= gameState.settings.maxTurns) {
            // Find player with most stars, then most coins
            let bestPlayer = null;
            let bestScore = { stars: -1, coins: -1 };

            gameState.players.forEach((player, playerId) => {
                if (player.stars > bestScore.stars || 
                    (player.stars === bestScore.stars && player.coins > bestScore.coins)) {
                    bestPlayer = player;
                    bestScore = { stars: player.stars, coins: player.coins };
                }
            });

            winner = bestPlayer;
        }

        return winner;
    }

    // Get game statistics
    getGameStats(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        const stats = {
            gameId,
            turnCount: gameState.turnCount,
            maxTurns: gameState.settings.maxTurns,
            currentPlayer: this.getCurrentPlayer(gameId),
            players: Array.from(gameState.players.values()).map(player => ({
                id: player.id,
                name: player.name,
                coins: player.coins,
                stars: player.stars,
                position: player.position
            })),
            leaderboard: this.getLeaderboard(gameId),
            gameEvents: gameState.gameEvents.slice(-10), // Last 10 events
            starLocations: Array.from(gameState.starLocations.values())
        };

        return stats;
    }

    // Get leaderboard
    getLeaderboard(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return [];

        return Array.from(gameState.players.values())
            .sort((a, b) => {
                if (a.stars !== b.stars) return b.stars - a.stars;
                return b.coins - a.coins;
            })
            .map((player, index) => ({
                rank: index + 1,
                id: player.id,
                name: player.name,
                stars: player.stars,
                coins: player.coins
            }));
    }

    // Execute chance event
    executeChanceEvent(gameId, eventType) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        const players = Array.from(gameState.players.values());
        const results = [];

        switch (eventType) {
            case 'swap_positions_random':
                if (players.length >= 2) {
                    const player1 = players[Math.floor(Math.random() * players.length)];
                    let player2 = players[Math.floor(Math.random() * players.length)];
                    while (player2.id === player1.id && players.length > 1) {
                        player2 = players[Math.floor(Math.random() * players.length)];
                    }

                    const temp = player1.position;
                    player1.position = player2.position;
                    player2.position = temp;

                    this.playerPositions.set(player1.id, player1.position);
                    this.playerPositions.set(player2.id, player2.position);

                    results.push({
                        type: 'position_swap',
                        players: [player1.name, player2.name],
                        message: `${player1.name} and ${player2.name} swapped positions!`
                    });
                }
                break;

            case 'steal_coins_random':
                if (players.length >= 2) {
                    const richestPlayer = players.reduce((prev, current) => 
                        (prev.coins > current.coins) ? prev : current
                    );
                    const targetPlayer = players.find(p => p.id !== richestPlayer.id && p.coins < richestPlayer.coins);
                    
                    if (targetPlayer && richestPlayer.coins > 0) {
                        const stolenCoins = Math.min(5, richestPlayer.coins);
                        richestPlayer.coins -= stolenCoins;
                        targetPlayer.coins += stolenCoins;

                        results.push({
                            type: 'coin_steal',
                            from: richestPlayer.name,
                            to: targetPlayer.name,
                            amount: stolenCoins,
                            message: `${targetPlayer.name} stole ${stolenCoins} coins from ${richestPlayer.name}!`
                        });
                    }
                }
                break;

            case 'everyone_gains_coins':
                players.forEach(player => {
                    player.coins += 5;
                });
                results.push({
                    type: 'coin_shower',
                    message: 'Everyone gained 5 coins!'
                });
                break;

            case 'everyone_loses_coins':
                players.forEach(player => {
                    const lostCoins = Math.min(3, player.coins);
                    player.coins -= lostCoins;
                });
                results.push({
                    type: 'coin_tax',
                    message: 'Everyone lost 3 coins!'
                });
                break;

            case 'teleport_to_star':
                const gameState = this.gameStates.get(gameId);
                const activeStars = Array.from(gameState.starLocations.values());
                if (activeStars.length > 0) {
                    const randomPlayer = players[Math.floor(Math.random() * players.length)];
                    const targetStar = activeStars[Math.floor(Math.random() * activeStars.length)];
                    
                    randomPlayer.position = targetStar.currentLocation;
                    this.playerPositions.set(randomPlayer.id, targetStar.currentLocation);

                    results.push({
                        type: 'teleport_star',
                        player: randomPlayer.name,
                        message: `${randomPlayer.name} was teleported to a star!`
                    });
                }
                break;
        }

        // Log the chance event
        gameState.gameEvents.push({
            type: 'chance_event',
            eventType,
            results,
            timestamp: Date.now()
        });

        return results;
    }

    // Purchase item from shop
    purchaseItem(gameId, playerId, itemId) {
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);

        if (!gameState || !playerState) {
            throw new Error('Game or player not found');
        }

        const shopItems = {
            mushroom: { price: 5, name: 'Mushroom', effect: 'extra_dice' },
            star_pipe: { price: 15, name: 'Star Pipe', effect: 'warp_to_star' },
            coin_bag: { price: 8, name: 'Coin Bag', effect: 'gain_coins' },
            swap_card: { price: 12, name: 'Swap Card', effect: 'swap_position' }
        };

        const item = shopItems[itemId];
        if (!item) {
            throw new Error('Item not found');
        }

        if (playerState.coins < item.price) {
            throw new Error('Insufficient coins');
        }

        // Purchase item
        playerState.coins -= item.price;
        playerState.items.push({
            id: itemId,
            name: item.name,
            effect: item.effect,
            purchaseTime: Date.now()
        });

        gameState.gameEvents.push({
            type: 'item_purchase',
            playerId,
            itemId,
            price: item.price,
            timestamp: Date.now()
        });

        return {
            success: true,
            item,
            remainingCoins: playerState.coins
        };
    }

    // Use item
    useItem(gameId, playerId, itemIndex) {
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);

        if (!gameState || !playerState) {
            throw new Error('Game or player not found');
        }

        if (itemIndex < 0 || itemIndex >= playerState.items.length) {
            throw new Error('Invalid item index');
        }

        const item = playerState.items[itemIndex];
        let result = null;

        switch (item.effect) {
            case 'extra_dice':
                result = {
                    type: 'extra_dice',
                    message: 'Roll the dice again!',
                    extraRoll: true
                };
                break;

            case 'warp_to_star':
                const activeStars = Array.from(gameState.starLocations.values());
                if (activeStars.length > 0) {
                    const targetStar = activeStars[0];
                    playerState.position = targetStar.currentLocation;
                    this.playerPositions.set(playerId, targetStar.currentLocation);
                    result = {
                        type: 'warp_star',
                        message: 'Warped to the star!',
                        newPosition: targetStar.currentLocation
                    };
                }
                break;

            case 'gain_coins':
                playerState.coins += 10;
                result = {
                    type: 'gain_coins',
                    message: 'Gained 10 coins!',
                    coins: 10
                };
                break;

            case 'swap_position':
                // This would require selecting another player
                result = {
                    type: 'swap_select',
                    message: 'Select a player to swap positions with',
                    requiresTarget: true
                };
                break;
        }

        // Remove used item
        playerState.items.splice(itemIndex, 1);

        gameState.gameEvents.push({
            type: 'item_use',
            playerId,
            item: item.name,
            result,
            timestamp: Date.now()
        });

        return result;
    }

    // Save game state
    saveGameState(gameId) {
        const gameState = this.gameStates.get(gameId);
        if (!gameState) return null;

        const saveData = {
            gameId: gameState.gameId,
            boardId: gameState.boardId,
            players: Object.fromEntries(gameState.players),
            turnOrder: gameState.turnOrder,
            currentPlayerIndex: gameState.currentPlayerIndex,
            starLocations: Object.fromEntries(gameState.starLocations),
            turnCount: gameState.turnCount,
            gamePhase: gameState.gamePhase,
            settings: gameState.settings,
            gameEvents: gameState.gameEvents.slice(-50) // Keep last 50 events
        };

        return JSON.stringify(saveData);
    }

    // Load game state
    loadGameState(saveData) {
        const data = JSON.parse(saveData);
        
        const gameState = {
            gameId: data.gameId,
            boardId: data.boardId,
            players: new Map(Object.entries(data.players)),
            turnOrder: data.turnOrder,
            currentPlayerIndex: data.currentPlayerIndex,
            starLocations: new Map(Object.entries(data.starLocations)),
            itemShops: new Map(),
            gameEvents: data.gameEvents || [],
            turnCount: data.turnCount || 0,
            gamePhase: data.gamePhase || 'movement',
            settings: data.settings || {
                maxTurns: 20,
                starsToWin: 3,
                startingCoins: 10
            }
        };

        this.gameStates.set(data.gameId, gameState);

        // Restore player positions
        gameState.players.forEach((player, playerId) => {
            this.playerPositions.set(playerId, player.position);
        });

        return gameState;
    }

    // Get all available themes
    getAvailableThemes() {
        return Object.values(PARTY_BOARD_THEMES);
    }

    // Get theme by ID
    getTheme(themeId) {
        return PARTY_BOARD_THEMES[themeId.toUpperCase()] || PARTY_BOARD_THEMES.CRYSTAL_CASTLE;
    }

    // Clean up finished games
    cleanupGame(gameId) {
        this.gameStates.delete(gameId);
        
        // Clean up player positions for this game
        const gameState = this.gameStates.get(gameId);
        if (gameState) {
            gameState.players.forEach((player, playerId) => {
                this.playerPositions.delete(playerId);
            });
        }

        console.log(`Cleaned up game ${gameId}`);
    }
}

// Export for use in other components
export { PARTY_BOARD_THEMES, PARTY_SPACE_TYPES };
            this.moveStarToNewLocation(gameId);
            
            return {
                type: 'star_purchased',
                message: 'Purchased a star for 20 coins!',
                coins: -20,
                stars: 1
            };
        } else {
            return {
                type: 'star_insufficient_coins',
                message: `Need 20 coins to buy a star! (You have ${playerState.coins})`,
                coins: 0,
                stars: 0
            };
        }
    }

    // Handle minigame space
    handleMinigameSpace(gameId, playerId) {
        // Trigger minigame selection
        const minigames = [
            'reaction_time',
            'memory_match',
            'puzzle_solve',
            'rhythm_game',
            'dexterity_test'
        ];

        const selectedGame = minigames[Math.floor(Math.random() * minigames.length)];

        return {
            type: 'minigame',
            message: 'Time for a mini-game!',
            minigame: selectedGame,
            players: this.getNearbyPlayers(gameId, playerId)
        };
    }

    // Handle event space
    handleEventSpace(gameId, playerId) {
        const events = [
            { type: 'coin_shower', message: 'Coin shower! Gained 10 coins!', coins: 10 },
            { type: 'coin_loss', message: 'Pickpocketed! Lost 5 coins!', coins: -5 },
            { type: 'teleport', message: 'Magic teleporter activated!', teleport: true },
            { type: 'item_gift', message: 'Found a mysterious item!', item: 'random' },
            { type: 'extra_turn', message: 'Lucky break! Take another turn!', extraTurn: true }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);

        // Apply event effect
        if (event.coins) {
            const coinsChange = event.coins > 0 ? event.coins : Math.max(event.coins, -playerState.coins);
            playerState.coins += coinsChange;
            event.actualCoins = coinsChange;
        }

        if (event.teleport) {
            // Teleport to random space
            const board = this.getBoardForGame(gameId);
            const randomSpace = board.spaces[Math.floor(Math.random() * board.spaces.length)];
            this.movePlayer(gameId, playerId, randomSpace.id);
            event.newPosition = randomSpace.id;
        }

        return event;
    }

    // Handle shop space
    handleShopSpace(gameId, playerId) {
        const items = [
            { id: 'mushroom', name: 'Mushroom', price: 5, effect: 'Extra dice roll' },
            { id: 'star_pipe', name: 'Star Pipe', price: 15, effect: 'Warp to star' },
            { id: 'coin_bag', name: 'Coin Bag', price: 8, effect: '10 extra coins' },
            { id: 'swap_card', name: 'Swap Card', price: 12, effect: 'Swap positions with another player' }
        ];

        return {
            type: 'shop',
            message: 'Welcome to the item shop!',
            items,
            canPurchase: true
        };
    }

    // Handle warp space
    handleWarpSpace(gameId, playerId) {
        const board = this.getBoardForGame(gameId);
        const warpSpaces = board.spaces.filter(s => s.type === 'WARP');
        
        if (warpSpaces.length > 1) {
            // Warp to random warp space
            const otherWarps = warpSpaces.filter(s => s.id !== playerState.position);
            const targetWarp = otherWarps[Math.floor(Math.random() * otherWarps.length)];
            
            this.movePlayer(gameId, playerId, targetWarp.id);
            
            return {
                type: 'warp',
                message: 'Warped through space!',
                newPosition: targetWarp.id
            };
        }

        return {
            type: 'warp_failed',
            message: 'Warp system offline...'
        };
    }

    // Handle chance space
    handleChanceSpace(gameId, playerId) {
        const chanceEvents = [
            'swap_positions_random',
            'steal_coins_random',
            'give_coins_random',
            'teleport_to_star',
            'reverse_turn_order',
            'everyone_loses_coins',
            'everyone_gains_coins'
        ];

        const event = chanceEvents[Math.floor(Math.random() * chanceEvents.length)];
        
        return {
            type: 'chance',
            message: 'Chance time! Anything could happen!',
            chanceEvent: event,
            requiresExecution: true
        };
    }

    // Handle villain space
    handleVillainSpace(gameId, playerId) {
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);
        
        const villainEvents = [
            { type: 'steal_coins', amount: Math.min(10, playerState.coins) },
            { type: 'steal_star', condition: playerState.stars > 0 },
            { type: 'force_minigame', difficulty: 'hard' },
            { type: 'curse', effect: 'half_movement_next_turn' }
        ];

        let selectedEvent = villainEvents[0]; // Default to coin steal
        
        // Pick appropriate event based on player state
        if (playerState.stars > 0 && Math.random() < 0.3) {
            selectedEvent = villainEvents[1]; // Star steal
        } else if (Math.random() < 0.4) {
            selectedEvent = villainEvents[2]; // Force minigame
        }

        // Apply villain effect
        switch (selectedEvent.type) {
            case 'steal_coins':
                playerState.coins = Math.max(0, playerState.coins - selectedEvent.amount);
                return {
                    type: 'villain_coins',
                    message: `The villain stole ${selectedEvent.amount} coins!`,
                    coins: -selectedEvent.amount
                };

            case 'steal_star':
                if (playerState.stars > 0) {
                    playerState.stars -= 1;
                    return {
                        type: 'villain_star',
                        message: 'The villain stole one of your stars!',
                        stars: -1
                    };
                }
                break;

            case 'force_minigame':
                return {
                    type: 'villain_minigame',
                    message: 'The villain challenges you to a duel!',
                    minigame: 'villain_duel',
                    difficulty: 'hard'
                };
        }

        return {
            type: 'villain_encounter',
            message: 'The villain glares at you menacingly...'
        };
    }

    // Handle bank space
    handleBankSpace(gameId, playerId) {
        const gameState = this.gameStates.get(gameId);
        const playerState = gameState.players.get(playerId);

        // Bank gives coins based on current turn
        const bankBonus = Math.max(5, gameState.turnCount);
        playerState.coins += bankBonus;

        return {
            type: 'bank',
            message: `Bank bonus! Received ${bankBonus} coins!`,
            coins: bankBonus
        };
    }

    // Move star to new location