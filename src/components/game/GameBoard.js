// src/components/game/GameBoard.js
// Fixed version with working player movement

import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play, Battery, Trophy } from 'lucide-react';
import EnhancedGameBoard from './EnhancedGameBoard';
import { BoardManager, EnhancedBoardGenerator, BOARD_THEMES } from '../../systems/board-system';
import BoardDebugPanel from '../debug/BoardDebugPanel';

const gameService = new GameService();

export function GameBoard({ 
  game: initialGame, 
  user, 
  onLeaveGame, 
  energySystem, 
  progressionSystem, 
  miniGameSystem, 
  boardSystem 
}) {
    const [game, setGame] = useState(initialGame);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    
    // Enhanced state for MMO Party Quest features
    const [currentEnergy, setCurrentEnergy] = useState(5);
    const [playerProfile, setPlayerProfile] = useState(null);
    const [diceValue, setDiceValue] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [lastSpaceEffect, setLastSpaceEffect] = useState(null);
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [pendingMiniGame, setPendingMiniGame] = useState(null);

    // Existing board state
    const [board, setBoard] = useState(null);
    const [boardManager, setBoardManager] = useState(null);

    // Initialize energy and progression tracking
    useEffect(() => {
        if (user && energySystem && progressionSystem) {
            // Update energy display
            setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
            
            // Load player profile
            const profile = progressionSystem.getPlayerProfile(user.uid);
            setPlayerProfile(profile);
            
            // Listen for energy updates
            const handleEnergyUpdate = () => {
                setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
            };
            
            window.addEventListener('energyUpdated', handleEnergyUpdate);
            return () => window.removeEventListener('energyUpdated', handleEnergyUpdate);
        }
    }, [user, energySystem, progressionSystem]);

    // Board generation effect
    useEffect(() => {
        if (game.status !== 'active' || board) {
            return;
        }

        console.log("Generating board for game...");

        try {
            // Use existing board generation that works
            const theme = BOARD_THEMES[game.boardTheme || 'JUNGLE_ADVENTURE'];
            const generator = new EnhancedBoardGenerator(theme);
            const generatedBoard = generator.generateMassiveBoard(10, 10, game.maxPlayers || 20);
            const manager = new BoardManager(generatedBoard);
            
            // Initialize player positions
            game.players.forEach((player, index) => {
                const spawnZone = generatedBoard.spawnZones[index % generatedBoard.spawnZones.length];
                const startSpace = generatedBoard.spaces.find(s =>
                    Math.abs(s.x - spawnZone.x) < 5 && Math.abs(s.y - spawnZone.y) < 5
                );
                if (startSpace) {
                    manager.updatePlayerPosition(player.userId, startSpace.id);
                }
            });

            setBoard(generatedBoard);
            setBoardManager(manager);
            console.log("Board generated successfully:", generatedBoard);
        } catch (error) {
            console.error("Failed to generate board:", error);
            setError("Failed to generate game board");
        }
    }, [game.status, game.id]);

    // Real-time game updates
    useEffect(() => {
        const unsubscribe = gameService.subscribeToGame(game.id, (updatedGame) => {
            if (updatedGame) {
                setGame(updatedGame);
            }
        });
        
        gameService.updatePlayerStatus(game.id, user.uid, true);

        return () => {
            unsubscribe();
            gameService.updatePlayerStatus(game.id, user.uid, false);
        };
    }, [game.id, user.uid]);

    // Enhanced dice rolling with energy consumption
    const handleDiceRoll = async () => {
        // Check energy before rolling
        if (energySystem && !energySystem.canTakeAction(user.uid, 1)) {
            // Show energy warning
            window.dispatchEvent(new CustomEvent('showEnergyPanel'));
            return;
        }

        setIsRolling(true);
        setError('');
        
        try {
            // Consume energy for the action
            if (energySystem) {
                energySystem.spendEnergy(user.uid, 1);
            }
            
            // Apply skill effects to dice roll
            let rollValue = Math.floor(Math.random() * 6) + 1;
            if (progressionSystem) {
                rollValue = progressionSystem.applySkillEffects(user.uid, 'dice_roll', rollValue);
            }
            
            setDiceValue(rollValue);
            
            // Award XP for taking a turn
            if (progressionSystem) {
                progressionSystem.awardActionXP(user.uid, 'space_visited');
            }
            
            // Move player after short delay
            setTimeout(() => {
                handlePlayerMove(rollValue);
            }, 1000);
            
        } catch (error) {
            setError('Failed to roll dice: ' + error.message);
        } finally {
            setTimeout(() => setIsRolling(false), 1000);
        }
    };

    // Enhanced player movement with space effects
    const handlePlayerMove = async (spaces) => {
        try {
            const currentPlayer = game.players.find(p => p.userId === user.uid);
            if (!currentPlayer) {
                throw new Error('Player not found in game');
            }

            const newPosition = (currentPlayer.position || 0) + spaces;
            
            // Calculate new energy after the move (already spent 1 for rolling)
            const newEnergy = energySystem ? energySystem.getCurrentEnergy(user.uid) : currentPlayer.energy;
            
            // Simulate coin changes based on space type
            const spaceTypes = ['gain', 'lose', 'neutral', 'special'];
            const randomSpaceType = spaceTypes[Math.floor(Math.random() * spaceTypes.length)];
            
            let coinChange = 0;
            let effectMessage = '';
            
            switch (randomSpaceType) {
                case 'gain':
                    coinChange = 3;
                    effectMessage = 'Gained 3 coins!';
                    break;
                case 'lose':
                    coinChange = -3;
                    effectMessage = 'Lost 3 coins!';
                    break;
                case 'special':
                    coinChange = 10;
                    effectMessage = 'Found treasure! Gained 10 coins!';
                    break;
                default:
                    effectMessage = 'Nothing happens.';
            }
            
            const newCoins = Math.max(0, (currentPlayer.coins || 0) + coinChange);
            
            // Update the game using the existing makeMove method
            const moveData = {
                newPosition: newPosition,
                newCoins: newCoins,
                newStars: currentPlayer.stars || 0,
                newEnergy: newEnergy
            };
            
            await gameService.makeMove(game.id, user.uid, moveData);
            
            // Set space effect for UI feedback
            setLastSpaceEffect({
                spaceType: randomSpaceType,
                description: effectMessage,
                coinChange: coinChange
            });
            
            // Award progression
            if (progressionSystem) {
                if (coinChange > 0) {
                    progressionSystem.updateStats(user.uid, { totalCoinsEarned: coinChange });
                }
                
                progressionSystem.updateStats(user.uid, {
                    uniqueSpacesVisited: randomSpaceType
                });
            }
            
            // Update local board manager if available
            if (boardManager) {
                boardManager.updatePlayerPosition(user.uid, newPosition);
            }
            
        } catch (error) {
            console.error('Move error:', error);
            setError('Failed to move player: ' + error.message);
        }
    };

    // Game control functions
    const isHost = game.hostId === user.uid;
    const canStartGame = isHost && game.status === 'waiting' && game.players.length >= 2;
    const currentPlayer = game.players.find(p => p.userId === user.uid);
    const canTakeAction = currentEnergy >= 1 && !isRolling;

    const startGame = async () => {
        setLoading(true);
        setError('');
        try {
            await gameService.startGame(game.id, user.uid);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyGameCode = async () => {
        try {
            await navigator.clipboard.writeText(game.gameCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    };

    // Waiting Room UI
    if (game.status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <button 
                            onClick={onLeaveGame}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Lobby
                        </button>
                        
                        <div className="flex items-center gap-4">
                            {/* Energy Display */}
                            <div className="bg-white/10 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <Battery className="w-4 h-4 text-yellow-400" />
                                    <span className="text-white text-sm font-semibold">
                                        {currentEnergy}/5
                                    </span>
                                </div>
                            </div>
                            
                            {/* Player Level */}
                            {playerProfile && (
                                <div className="bg-purple-600 rounded-lg px-3 py-2">
                                    <span className="text-white text-sm font-semibold">
                                        Lv.{playerProfile.level}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Game Info Card */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Game Lobby
                                </h1>
                                <p className="text-gray-300">
                                    Waiting for players to join...
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/40">
                                    <div className="text-2xl font-bold text-yellow-400 mb-1">
                                        #{game.gameCode}
                                    </div>
                                    <button 
                                        onClick={copyGameCode}
                                        className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors mx-auto"
                                    >
                                        <Copy className="w-3 h-3" />
                                        {copied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Game Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {game.players.length}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Players (Max: {game.maxPlayers || 200})
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">
                                    {game.status}
                                </div>
                                <div className="text-gray-400 text-sm">Status</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                    MMO
                                </div>
                                <div className="text-gray-400 text-sm">Game Mode</div>
                            </div>
                        </div>

                        {/* Host Controls */}
                        {isHost && (
                            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/40 mb-6">
                                <h3 className="text-white font-semibold mb-2">Host Controls</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    You are the host. You can start the game when at least 2 players have joined.
                                </p>
                                <button 
                                    onClick={startGame}
                                    disabled={!canStartGame || loading}
                                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                        canStartGame && !loading
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {loading ? 'Starting...' : canStartGame ? 'Start Game' : 'Need More Players'}
                                </button>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Players List */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Players ({game.players.length}/{game.maxPlayers || 200})
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {game.players.map((player, index) => (
                                <div key={player.userId} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {(player.name || player.displayName || 'P').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">
                                                {player.name || player.displayName || `Player ${index + 1}`}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                {player.userId === game.hostId && (
                                                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                                                        Host
                                                    </span>
                                                )}
                                                {player.userId === user.uid && (
                                                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                                                        You
                                                    </span>
                                                )}
                                                <span className={`w-2 h-2 rounded-full ${
                                                    player.online ? 'bg-green-400' : 'bg-gray-400'
                                                }`} />
                                                <span className="text-gray-400">
                                                    {player.online ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Invite More Players */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-400 mb-3">
                                Share the game code with friends to invite them!
                            </p>
                            <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg">
                                <span className="font-mono font-bold text-lg">#{game.gameCode}</span>
                                <button onClick={copyGameCode} className="hover:text-yellow-300">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Active Game UI
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
            {/* Game Header */}
            <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <button 
                        onClick={onLeaveGame}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Leave Game
                    </button>

                    {/* Game Info */}
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-white font-bold">Game Board</div>
                            <div className="text-gray-400 text-sm">
                                {game.players.length} players
                            </div>
                        </div>

                        {/* Player Stats */}
                        {currentPlayer && (
                            <div className="flex items-center gap-4">
                                <div className="bg-yellow-500/20 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-yellow-400" />
                                        <span className="text-white font-semibold">
                                            {currentPlayer.coins || 0}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="bg-purple-500/20 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-purple-400" />
                                        <span className="text-white font-semibold">
                                            {currentPlayer.stars || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-blue-500/20 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Battery className="w-4 h-4 text-blue-400" />
                                        <span className="text-white font-semibold">
                                            {currentEnergy}/5
                                        </span>
                                    </div>
                                </div>

                                {playerProfile && (
                                    <div className="bg-green-500/20 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-green-400" />
                                            <span className="text-white font-semibold">
                                                Lv.{playerProfile.level}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Game Area */}
            <main className="flex-1 p-4">
                <div className="max-w-6xl mx-auto">
                    {/* Game Controls */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Dice Display */}
                                <div className="bg-white rounded-lg p-4 min-w-[80px] text-center">
                                    {isRolling ? (
                                        <div className="animate-spin text-2xl">🎲</div>
                                    ) : diceValue ? (
                                        <div className="text-2xl font-bold text-gray-800">{diceValue}</div>
                                    ) : (
                                        <div className="text-2xl text-gray-400">?</div>
                                    )}
                                </div>

                                {/* Roll Button */}
                                <button 
                                    onClick={handleDiceRoll}
                                    disabled={!canTakeAction}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                        canTakeAction
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isRolling ? 'Rolling...' : 'Roll Dice (1 Energy)'}
                                </button>
                            </div>

                            {/* Last Space Effect */}
                            {lastSpaceEffect && (
                                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/40">
                                    <h4 className="text-white font-semibold mb-1">Space Effect</h4>
                                    <p className="text-gray-300 text-sm">
                                        {lastSpaceEffect.description}
                                    </p>
                                    {lastSpaceEffect.coinChange && (
                                        <p className="text-yellow-400 text-sm font-semibold">
                                            {lastSpaceEffect.coinChange > 0 ? '+' : ''}{lastSpaceEffect.coinChange} coins
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Energy Warning */}
                        {currentEnergy < 1 && (
                            <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-red-200">
                                    <Battery className="w-4 h-4" />
                                    <span className="font-semibold">Out of Energy!</span>
                                </div>
                                <p className="text-red-300 text-sm mt-1">
                                    Wait for energy to regenerate or purchase more to continue playing.
                                </p>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Game Board or Simple Board Display */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden" style={{ height: '600px' }}>
                        {board && boardManager ? (
                            <>
                                <EnhancedGameBoard
                                    game={game}
                                    board={board}
                                    boardManager={boardManager}
                                    currentPlayer={currentPlayer}
                                    onSpaceClick={(spaceId) => console.log('Space clicked:', spaceId)}
                                    onPlayerMove={handlePlayerMove}
                                    onDiceRoll={handleDiceRoll}
                                />
                                
                                {/* Debug Panel - Remove this in production 
                                <BoardDebugPanel 
                                    board={board}
                                    boardManager={boardManager}
                                    game={game}
                                    currentPlayer={currentPlayer}
                                />*/}
                            </>
                        ) : (
                            // Simple fallback board display
                            <div className="p-8">
                                <h3 className="text-white text-xl font-bold mb-6 text-center">Game Board</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {game.players.map((player, index) => (
                                        <div key={player.userId} className="bg-white/10 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {(player.name || player.displayName || 'P').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-white font-semibold">
                                                    {player.name || player.displayName || `Player ${index + 1}`}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Position:</span>
                                                    <span className="text-white">{player.position || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Coins:</span>
                                                    <span className="text-yellow-400">{player.coins || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Stars:</span>
                                                    <span className="text-purple-400">{player.stars || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}