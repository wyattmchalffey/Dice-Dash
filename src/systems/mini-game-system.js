// src/systems/mini-game-system.js
// Core mini-game system for MMO Party Quest

export class MiniGameSystem {
    constructor() {
        this.games = new Map();
        this.activeGames = new Map();
        this.leaderboards = new Map();
        
        this.registerDefaultGames();
    }

    // Register all default mini-games
    registerDefaultGames() {
        // Skill-based games
        this.registerGame('fruit_slash', {
            name: 'Fruit Slash',
            category: 'skill',
            duration: 30000, // 30 seconds
            maxPlayers: 200,
            description: 'Slash fruits, avoid bombs!',
            rewards: { coins: 50, xp: 25 }
        });

        this.registerGame('precision_tap', {
            name: 'Precision Tap',
            category: 'skill',
            duration: 45000,
            maxPlayers: 4,
            description: 'Tap targets with perfect timing',
            rewards: { coins: 40, xp: 20 }
        });

        // Luck-based games
        this.registerGame('lucky_spin', {
            name: 'Lucky Spin',
            category: 'luck',
            duration: 15000,
            maxPlayers: 200,
            description: 'Spin the wheel of fortune!',
            rewards: { coins: 30, xp: 15 }
        });

        this.registerGame('memory_match', {
            name: 'Memory Match',
            category: 'memory',
            duration: 60000,
            maxPlayers: 4,
            description: 'Remember the pattern sequence',
            rewards: { coins: 60, xp: 30 }
        });

        // Strategy-based games
        this.registerGame('tower_rush', {
            name: 'Tower Rush',
            category: 'strategy',
            duration: 90000,
            maxPlayers: 4,
            description: 'Build towers to defend your base',
            rewards: { coins: 80, xp: 40 }
        });

        this.registerGame('racing_dash', {
            name: 'Racing Dash',
            category: 'racing',
            duration: 30000,
            maxPlayers: 8,
            description: 'Race to the finish line!',
            rewards: { coins: 70, xp: 35 }
        });
    }

    // Register a new mini-game
    registerGame(id, config) {
        this.games.set(id, {
            id,
            ...config,
            registered: Date.now()
        });
    }

    // Get available games
    getAvailableGames() {
        return Array.from(this.games.values());
    }

    // Get game by ID
    getGame(gameId) {
        return this.games.get(gameId);
    }

    // Start a mini-game instance
    async startGame(gameId, players, options = {}) {
        const gameConfig = this.games.get(gameId);
        if (!gameConfig) {
            throw new Error(`Mini-game ${gameId} not found`);
        }

        if (players.length > gameConfig.maxPlayers) {
            throw new Error(`Too many players for ${gameConfig.name}`);
        }

        const gameInstance = {
            id: this.generateGameInstanceId(),
            gameId,
            config: gameConfig,
            players: players.map(player => ({
                ...player,
                score: 0,
                status: 'waiting',
                joinedAt: Date.now()
            })),
            status: 'starting',
            startTime: Date.now(),
            endTime: Date.now() + gameConfig.duration,
            options,
            events: []
        };

        this.activeGames.set(gameInstance.id, gameInstance);

        // Notify all players
        this.notifyPlayers(gameInstance, 'game_starting', {
            countdown: 3000 // 3 second countdown
        });

        // Start the game after countdown
        setTimeout(() => {
            this.beginGameplay(gameInstance.id);
        }, 3000);

        return gameInstance;
    }

    // Begin actual gameplay
    beginGameplay(instanceId) {
        const game = this.activeGames.get(instanceId);
        if (!game) return;

        game.status = 'active';
        game.players.forEach(player => {
            player.status = 'playing';
        });

        this.notifyPlayers(game, 'game_started', {
            duration: game.config.duration
        });

        // Set end game timer
        setTimeout(() => {
            this.endGame(instanceId);
        }, game.config.duration);
    }

    // End a mini-game and calculate results
    endGame(instanceId) {
        const game = this.activeGames.get(instanceId);
        if (!game || game.status === 'finished') return;

        game.status = 'finished';
        game.actualEndTime = Date.now();

        // Calculate final rankings
        const rankings = this.calculateRankings(game);
        
        // Distribute rewards
        const rewards = this.distributeRewards(game, rankings);

        // Update leaderboards
        this.updateLeaderboards(game, rankings);

        // Notify players of results
        this.notifyPlayers(game, 'game_finished', {
            rankings,
            rewards,
            duration: game.actualEndTime - game.startTime
        });

        // Clean up after 30 seconds
        setTimeout(() => {
            this.activeGames.delete(instanceId);
        }, 30000);

        return { rankings, rewards };
    }

    // Calculate player rankings
    calculateRankings(game) {
        return game.players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                rank: index + 1,
                playerId: player.id,
                playerName: player.name,
                score: player.score,
                reward: this.calculateReward(game.config, index + 1, game.players.length)
            }));
    }

    // Calculate rewards based on ranking
    calculateReward(gameConfig, rank, totalPlayers) {
        const baseReward = gameConfig.rewards;
        let multiplier = 1;

        // Ranking multipliers
        if (rank === 1) multiplier = 1.5; // Winner bonus
        else if (rank === 2) multiplier = 1.2;
        else if (rank === 3) multiplier = 1.1;
        else if (rank > totalPlayers / 2) multiplier = 0.7; // Bottom half penalty

        return {
            coins: Math.floor(baseReward.coins * multiplier),
            xp: Math.floor(baseReward.xp * multiplier),
            rank
        };
    }

    // Distribute rewards to players
    distributeRewards(game, rankings) {
        const rewardMap = new Map();
        
        rankings.forEach(ranking => {
            rewardMap.set(ranking.playerId, ranking.reward);
            
            // Log reward for analytics
            this.logReward(ranking.playerId, ranking.reward, game.gameId);
        });

        return rewardMap;
    }

    // Update player score during game
    updatePlayerScore(instanceId, playerId, scoreChange, event = null) {
        const game = this.activeGames.get(instanceId);
        if (!game || game.status !== 'active') return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        player.score += scoreChange;
        player.score = Math.max(0, player.score); // Prevent negative scores

        // Log the event
        if (event) {
            game.events.push({
                playerId,
                event,
                scoreChange,
                newScore: player.score,
                timestamp: Date.now()
            });
        }

        // Notify other players of score update
        this.notifyPlayers(game, 'score_updated', {
            playerId,
            newScore: player.score,
            scoreChange
        });

        return player.score;
    }

    // Handle player input/action
    handlePlayerAction(instanceId, playerId, action, data) {
        const game = this.activeGames.get(instanceId);
        if (!game || game.status !== 'active') return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        // Process action based on game type
        switch (game.gameId) {
            case 'fruit_slash':
                return this.handleFruitSlashAction(game, player, action, data);
            case 'precision_tap':
                return this.handlePrecisionTapAction(game, player, action, data);
            case 'memory_match':
                return this.handleMemoryMatchAction(game, player, action, data);
            case 'racing_dash':
                return this.handleRacingAction(game, player, action, data);
            default:
                console.warn(`Unknown game action for ${game.gameId}:`, action);
        }
    }

    // Game-specific action handlers
    handleFruitSlashAction(game, player, action, data) {
        if (action === 'slash') {
            const { target, accuracy } = data;
            let scoreGain = 0;
            
            if (target === 'fruit') {
                scoreGain = Math.floor(10 * accuracy); // 0-10 points based on accuracy
            } else if (target === 'bomb') {
                scoreGain = -20; // Penalty for hitting bomb
            }
            
            return this.updatePlayerScore(game.id, player.id, scoreGain, {
                type: 'slash',
                target,
                accuracy
            });
        }
    }

    handlePrecisionTapAction(game, player, action, data) {
        if (action === 'tap') {
            const { timing, target } = data;
            let scoreGain = 0;
            
            if (timing < 50) scoreGain = 25; // Perfect timing
            else if (timing < 100) scoreGain = 15; // Good timing
            else if (timing < 200) scoreGain = 5; // OK timing
            else scoreGain = -5; // Miss penalty
            
            return this.updatePlayerScore(game.id, player.id, scoreGain, {
                type: 'tap',
                timing,
                target
            });
        }
    }

    handleMemoryMatchAction(game, player, action, data) {
        if (action === 'sequence_input') {
            const { sequence, correctSequence } = data;
            const matches = sequence.filter((item, index) => item === correctSequence[index]).length;
            const scoreGain = matches * 10;
            
            return this.updatePlayerScore(game.id, player.id, scoreGain, {
                type: 'memory',
                matches,
                total: correctSequence.length
            });
        }
    }

    handleRacingAction(game, player, action, data) {
        if (action === 'checkpoint') {
            const { checkpointId, time } = data;
            const scoreGain = Math.max(1, 100 - Math.floor(time / 100)); // Faster = more points
            
            return this.updatePlayerScore(game.id, player.id, scoreGain, {
                type: 'checkpoint',
                checkpointId,
                time
            });
        }
    }

    // Get leaderboards
    getLeaderboard(gameId, period = 'all_time') {
        const key = `${gameId}_${period}`;
        return this.leaderboards.get(key) || [];
    }

    // Update leaderboards
    updateLeaderboards(game, rankings) {
        const gameId = game.gameId;
        
        // Update all-time leaderboard
        this.updateLeaderboardPeriod(gameId, 'all_time', rankings);
        
        // Update daily leaderboard
        this.updateLeaderboardPeriod(gameId, 'daily', rankings);
        
        // Update weekly leaderboard
        this.updateLeaderboardPeriod(gameId, 'weekly', rankings);
    }

    updateLeaderboardPeriod(gameId, period, rankings) {
        const key = `${gameId}_${period}`;
        let leaderboard = this.leaderboards.get(key) || [];
        
        // Add new scores
        rankings.forEach(ranking => {
            const existingIndex = leaderboard.findIndex(entry => entry.playerId === ranking.playerId);
            
            if (existingIndex >= 0) {
                // Update if better score
                if (ranking.score > leaderboard[existingIndex].score) {
                    leaderboard[existingIndex] = {
                        ...ranking,
                        timestamp: Date.now()
                    };
                }
            } else {
                // Add new entry
                leaderboard.push({
                    ...ranking,
                    timestamp: Date.now()
                });
            }
        });
        
        // Sort and limit to top 100
        leaderboard = leaderboard
            .sort((a, b) => b.score - a.score)
            .slice(0, 100);
        
        this.leaderboards.set(key, leaderboard);
    }

    // Notify players
    notifyPlayers(game, event, data) {
        game.players.forEach(player => {
            // In a real implementation, this would use WebSocket or similar
            window.dispatchEvent(new CustomEvent('miniGameEvent', {
                detail: {
                    gameInstanceId: game.id,
                    playerId: player.id,
                    event,
                    data,
                    timestamp: Date.now()
                }
            }));
        });
    }

    // Get active game for player
    getPlayerActiveGame(playerId) {
        for (const [instanceId, game] of this.activeGames) {
            if (game.players.some(p => p.id === playerId)) {
                return game;
            }
        }
        return null;
    }

    // Leave game early
    leaveGame(instanceId, playerId) {
        const game = this.activeGames.get(instanceId);
        if (!game) return;

        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return;

        game.players[playerIndex].status = 'left';
        
        this.notifyPlayers(game, 'player_left', {
            playerId,
            remainingPlayers: game.players.filter(p => p.status !== 'left').length
        });

        // End game if no players left
        const activePlayers = game.players.filter(p => p.status === 'playing');
        if (activePlayers.length === 0) {
            this.endGame(instanceId);
        }
    }

    // Generate unique game instance ID
    generateGameInstanceId() {
        return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Log reward for analytics
    logReward(playerId, reward, gameId) {
        console.log('Mini-game reward:', {
            playerId,
            gameId,
            reward,
            timestamp: Date.now()
        });
    }

    // Get player statistics
    getPlayerStats(playerId, gameId = null) {
        // This would query from a database in a real implementation
        return {
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            wins: 0,
            winRate: 0
        };
    }

    // Clean up old finished games
    cleanup() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        for (const [instanceId, game] of this.activeGames) {
            if (game.status === 'finished' && (now - game.actualEndTime) > maxAge) {
                this.activeGames.delete(instanceId);
            }
        }
    }
}