// src/components/game/PartyGameBoard.js
// Updated main game component using standard-sized Mario Party-style boards

import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play, Battery, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import BoardRenderer from './BoardRenderer';
import { BoardManager, BOARD_THEMES } from '../../systems/board-manager';

const gameService = new GameService();

// Dice components for better UI
const DiceComponents = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export function GameBoard({ 
  game: initialGame, 
  user, 
  onLeaveGame, 
  energySystem, 
  progressionSystem, 
  miniGameSystem 
}) {
    const [game, setGame] = useState(initialGame);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    
    // Standard board system state
    const [boardManager] = useState(() => new BoardManager());
    const [gameInstance, setGameInstance] = useState(null);
    const [board, setBoard] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [gameStats, setGameStats] = useState(null);
    
    // Game action state
    const [diceValue, setDiceValue] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [validMoves, setValidMoves] = useState([]);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [lastSpaceEffect, setLastSpaceEffect] = useState(null);
    const [showShop, setShowShop] = useState(false);
    const [showChanceEvent, setShowChanceEvent] = useState(null);
    
    // UI state
    const [currentEnergy, setCurrentEnergy] = useState(5);
    const [playerProfile, setPlayerProfile] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('classic_plains');
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    // Initialize standard party game
    useEffect(() => {
        if (game && user) {
            initializeGame();
        }
    }, [game, user]);

    // Update game stats periodically
    useEffect(() => {
        if (gameInstance) {
            const interval = setInterval(() => {
                const stats = boardManager.getGameStats(gameInstance.gameId);
                setGameStats(stats);
                
                const current = boardManager.getCurrentPlayer(gameInstance.gameId);
                setCurrentPlayer(current);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [gameInstance, boardManager]);

    // Initialize the standard party game
    const initializeGame = async () => {
        try {
            setLoading(true);
            
            // Create standard-sized board
            const newBoard = boardManager.createBoard(
                game.gameId, 
                selectedTheme,
                Math.min(game.players?.length || 4, 8) // Cap at 8 players
            );
            
            setBoard(newBoard);
            
            // Add all players to the board
            if (game.players) {
                for (const player of game.players) {
                    try {
                        boardManager.addPlayer(game.gameId, player);
                    } catch (error) {
                        console.warn(`Failed to add player ${player.displayName}:`, error.message);
                    }
                }
            }
            
            // Get the game instance
            const instance = boardManager.getGameInstance(game.gameId);
            setGameInstance(instance);
            
            // Start the game if enough players
            if (game.status === 'active' && instance.players.size >= 2) {
                boardManager.startGame(game.gameId);
            }
            
            // Set current player
            const current = boardManager.getCurrentPlayer(game.gameId);
            setCurrentPlayer(current);
            
            console.log(`Party game initialized with ${newBoard.spaces.length} spaces`);
            
        } catch (error) {
            console.error('Failed to initialize party game:', error);
            setError('Failed to initialize game board: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle dice roll
    const handleRollDice = async () => {
        if (!gameInstance || !currentPlayer || isRolling) return;
        
        // Check if it's the current user's turn
        if (currentPlayer.userId !== user.uid) {
            setError("It's not your turn!");
            return;
        }

        // Check energy
        if (!energySystem.canTakeAction(user.uid, 1)) {
            setError("Not enough energy!");
            return;
        }

        try {
            setIsRolling(true);
            setError('');
            
            // Spend energy
            energySystem.spendEnergy(user.uid, 1);
            setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
            
            // Simulate dice roll animation
            const rollAnimation = setInterval(() => {
                setDiceValue(Math.floor(Math.random() * 6) + 1);
            }, 100);
            
            // Stop animation after 1 second and set final value
            setTimeout(() => {
                clearInterval(rollAnimation);
                const finalRoll = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalRoll);
                
                // Calculate valid moves
                const moves = boardManager.getValidMoves(game.gameId, user.uid, finalRoll);
                setValidMoves(moves);
                
                setIsRolling(false);
            }, 1000);
            
        } catch (error) {
            console.error('Error rolling dice:', error);
            setError('Failed to roll dice: ' + error.message);
            setIsRolling(false);
        }
    };

    // Handle space click/selection
    const handleSpaceClick = (space) => {
        if (!validMoves.includes(space.id)) {
            setError('Invalid move!');
            return;
        }
        
        setSelectedSpace(space.id);
    };

    // Handle player movement
    const handlePlayerMove = async () => {
        if (!selectedSpace || !currentPlayer || !gameInstance) return;
        
        try {
            setLoading(true);
            
            // Move player on the board
            const moveResult = boardManager.movePlayer(game.gameId, user.uid, selectedSpace);
            setLastSpaceEffect(moveResult.spaceEffect);
            
            // Process space effects
            await processSpaceEffect(moveResult.spaceEffect);
            
            // Clear move state
            setDiceValue(null);
            setValidMoves([]);
            setSelectedSpace(null);
            
            // Advance to next turn
            const nextPlayer = boardManager.nextTurn(game.gameId);
            setCurrentPlayer(nextPlayer);
            
            // Award XP for completing turn
            if (progressionSystem) {
                progressionSystem.awardActionXP(user.uid, 'turn_completed');
            }
            
        } catch (error) {
            console.error('Error moving player:', error);
            setError('Failed to move player: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Process space effects
    const processSpaceEffect = async (effects) => {
        if (!effects || effects.length === 0) return;
        
        for (const effect of effects) {
            switch (effect.type) {
                case 'coins':
                    // Coin effect already processed in boardManager
                    break;
                    
                case 'star_option':
                    // Show star purchase dialog
                    const buystar = window.confirm(effect.message);
                    if (buystar) {
                        const gameInstance = boardManager.getGameInstance(game.gameId);
                        const player = gameInstance.players.get(user.uid);
                        if (player && player.coins >= 20) {
                            player.coins -= 20;
                            player.stars += 1;
                        }
                    }
                    break;
                    
                case 'event':
                    // Trigger random event
                    await triggerRandomEvent();
                    break;
                    
                case 'minigame':
                    // Start minigame
                    if (miniGameSystem) {
                        setShowChanceEvent(effect);
                    }
                    break;
                    
                case 'shop':
                    setShowShop(true);
                    break;
            }
        }
    };

    // Trigger random events
    const triggerRandomEvent = async () => {
        const events = [
            { message: 'You found 5 extra coins!', coins: 5 },
            { message: 'A passing cloud gives you 2 coins!', coins: 2 },
            { message: 'You trip and lose 1 coin!', coins: -1 },
            { message: 'Lucky day! Gain 3 coins!', coins: 3 }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        // Apply event effect
        const gameInstance = boardManager.getGameInstance(game.gameId);
        const player = gameInstance.players.get(user.uid);
        if (player) {
            player.coins = Math.max(0, player.coins + event.coins);
        }
        
        // Show notification
        alert(event.message);
    };

    // Copy game code
    const copyGameCode = () => {
        navigator.clipboard.writeText(game.gameId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle theme change
    const handleThemeChange = (themeId) => {
        setSelectedTheme(themeId);
        setShowThemeSelector(false);
        
        // Reinitialize board with new theme
        if (gameInstance && board) {
            initializeGame();
        }
    };

    // Get player stats for UI
    const getPlayerStats = (userId) => {
        if (!gameInstance) return null;
        
        const player = gameInstance.players.get(userId);
        if (!player) return null;
        
        return {
            coins: player.coins || 0,
            stars: player.stars || 0,
            position: boardManager.getPlayerPosition(userId)
        };
    };

    // Get current user's stats
    const userStats = getPlayerStats(user?.uid);
    const isUserTurn = currentPlayer?.userId === user?.uid;

    if (loading && !board) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading board...</p>
                </div>
            </div>
        );
    }

    if (error && !board) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600">
                    <p className="mb-4">{error}</p>
                    <button 
                        onClick={() => {
                            setError('');
                            initializeGame();
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onLeaveGame}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Leave Game
                        </button>
                        
                        <div className="text-lg font-semibold">
                            {board?.name || 'Game Board'}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            {game.players?.length || 0}/{board?.maxPlayers || 8}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* User Stats */}
                        {userStats && (
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Coins className="w-4 h-4 text-yellow-500" />
                                    <span>{userStats.coins}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400" />
                                    <span>{userStats.stars}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Battery className="w-4 h-4 text-green-500" />
                                    <span>{currentEnergy}</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Game Code */}
                        <button
                            onClick={copyGameCode}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? 'Copied!' : game.gameId}
                        </button>
                        
                        {/* Theme Selector */}
                        <button
                            onClick={() => setShowThemeSelector(!showThemeSelector)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                        >
                            Theme
                        </button>
                    </div>
                </div>
                
                {/* Theme Selector Dropdown */}
                {showThemeSelector && (
                    <div className="absolute right-4 top-16 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        {Object.values(BOARD_THEMES).map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                                    selectedTheme === theme.id ? 'bg-blue-100 text-blue-700' : ''
                                }`}
                            >
                                {theme.name}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Current Turn Info */}
                {currentPlayer && (
                    <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Current turn: <span className="font-semibold">{currentPlayer.displayName}</span>
                            {isUserTurn && <span className="text-green-600 ml-2">• Your turn!</span>}
                        </div>
                        
                        {gameStats && (
                            <div className="text-sm text-gray-500">
                                Turn {gameStats.currentTurn + 1} • {gameStats.totalMoves} moves made
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex">
                {/* Board */}
                <div className="flex-1 relative">
                    {board && (
                        <BoardRenderer
                            board={board}
                            boardManager={boardManager}
                            currentPlayer={currentPlayer}
                            game={gameInstance}
                            onSpaceClick={handleSpaceClick}
                            onPlayerMove={handlePlayerMove}
                            validMoves={validMoves}
                            selectedSpace={selectedSpace}
                        />
                    )}
                    
                    {/* Error Message Overlay */}
                    {error && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                            {error}
                            <button 
                                onClick={() => setError('')}
                                className="ml-2 text-red-200 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>

                {/* Side Panel */}
                <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col">
                    {/* Dice Section */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-3">Roll Dice</h3>
                        
                        <div className="text-center mb-4">
                            {diceValue && (
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-2">
                                    {React.createElement(DiceComponents[diceValue - 1], {
                                        className: "w-8 h-8 text-blue-600"
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={handleRollDice}
                            disabled={!isUserTurn || isRolling || diceValue !== null || loading}
                            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRolling ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Rolling...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    {diceValue ? `Rolled ${diceValue}` : 'Roll Dice'}
                                </>
                            )}
                        </button>
                        
                        {validMoves.length > 0 && !selectedSpace && (
                            <p className="text-sm text-gray-600 mt-2">
                                Click on a highlighted space to move
                            </p>
                        )}
                        
                        {selectedSpace && (
                            <button
                                onClick={handlePlayerMove}
                                disabled={loading}
                                className="w-full mt-2 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                            >
                                Confirm Move
                            </button>
                        )}
                    </div>

                    {/* Players List */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-3">Players</h3>
                        <div className="space-y-2">
                            {game.players?.map((player, index) => {
                                const stats = getPlayerStats(player.userId);
                                const isCurrent = currentPlayer?.userId === player.userId;
                                
                                return (
                                    <div 
                                        key={player.userId}
                                        className={`p-3 rounded-lg border ${
                                            isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][index % 8] }}
                                                ></div>
                                                <span className="font-medium">{player.displayName}</span>
                                                {isCurrent && <span className="text-xs text-blue-600">•</span>}
                                            </div>
                                            
                                            {stats && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <Coins className="w-3 h-3 text-yellow-500" />
                                                        {stats.coins}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-400" />
                                                        {stats.stars}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Game Info */}
                    <div className="flex-1">
                        <h3 className="font-semibold mb-3">Game Info</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div>Status: <span className="font-medium">{game.status}</span></div>
                            <div>Board: <span className="font-medium">{board?.theme?.name}</span></div>
                            <div>Spaces: <span className="font-medium">{board?.spaces?.length}</span></div>
                            {gameStats && (
                                <>
                                    <div>Total Moves: <span className="font-medium">{gameStats.totalMoves}</span></div>
                                    <div>Game State: <span className="font-medium">{gameStats.gameState}</span></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showShop && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Item Shop</h3>
                        <p className="text-gray-600 mb-4">Shop feature coming soon!</p>
                        <button
                            onClick={() => setShowShop(false)}
                            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showChanceEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Chance Time!</h3>
                        <p className="text-gray-600 mb-4">{showChanceEvent.message}</p>
                        <button
                            onClick={() => setShowChanceEvent(null)}
                            className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}