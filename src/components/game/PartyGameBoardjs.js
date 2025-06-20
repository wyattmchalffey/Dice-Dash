// src/components/game/PartyGameBoard.js
// Updated GameBoard component with party-style board integration

import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play, Battery, Trophy, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import PartyBoardRenderer from './PartyBoardRenderer';
import { PartyBoardManager, PARTY_BOARD_THEMES } from '../../systems/party-board-manager';
import BoardDebugPanel from '../debug/BoardDebugPanel';

const gameService = new GameService();

export function PartyGameBoard({ 
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
    
    // Party board specific state
    const [boardManager] = useState(() => new PartyBoardManager());
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
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [currentEnergy, setCurrentEnergy] = useState(5);
    const [playerProfile, setPlayerProfile] = useState(null);

    // Initialize party board and game instance
    useEffect(() => {
        if (game && user) {
            initializePartyGame();
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

    // Initialize the party game
    const initializePartyGame = async () => {
        try {
            setLoading(true);
            
            // Determine board theme from game settings
            const themeId = game.settings?.theme || 'crystal_castle';
            
            // Create or get game instance
            let instance = boardManager.gameStates.get(game.id);
            if (!instance) {
                instance = boardManager.createGameInstance(game.id, themeId);
                
                // Add all players to the game
                if (game.players) {
                    game.players.forEach(player => {
                        boardManager.addPlayerToGame(game.id, player);
                    });
                }
            }
            
            setGameInstance(instance);
            
            // Get the board
            const gameBoard = boardManager.getBoardForGame(game.id);
            setBoard(gameBoard);
            
            // Get current player
            const current = boardManager.getCurrentPlayer(game.id);
            setCurrentPlayer(current);
            
            // Get initial stats
            const stats = boardManager.getGameStats(game.id);
            setGameStats(stats);
            
            console.log('Party game initialized:', {
                gameId: game.id,
                theme: themeId,
                boardSize: gameBoard ? `${gameBoard.width}x${gameBoard.height}` : 'unknown',
                players: instance.players.size
            });
            
        } catch (error) {
            console.error('Failed to initialize party game:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle dice roll
    const handleDiceRoll = async () => {
        if (!gameInstance || !currentPlayer || isRolling) return;

        // Check energy
        if (!energySystem.canTakeAction(user.uid, 1)) {
            setError('Not enough energy to take a turn!');
            return;
        }

        try {
            setIsRolling(true);
            setError('');
            
            // Animate dice roll
            const rollAnimation = setInterval(() => {
                setDiceValue(Math.floor(Math.random() * 6) + 1);
            }, 100);
            
            // Final dice value after 1 second
            setTimeout(() => {
                clearInterval(rollAnimation);
                const finalRoll = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalRoll);
                
                // Get valid moves
                const moves = boardManager.getValidMoves(gameInstance.gameId, currentPlayer.id, finalRoll);
                setValidMoves(moves);
                
                setIsRolling(false);
            }, 1000);
            
            // Consume energy
            energySystem.consumeEnergy(user.uid, 1);
            setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
            
        } catch (error) {
            console.error('Dice roll failed:', error);
            setError(error.message);
            setIsRolling(false);
        }
    };

    // Handle space selection
    const handleSpaceClick = async (space) => {
        if (!gameInstance || !currentPlayer || !validMoves.includes(space.id)) return;

        try {
            setLoading(true);
            setError('');
            
            // Move player
            const moveResult = boardManager.movePlayer(gameInstance.gameId, currentPlayer.id, space.id);
            
            // Handle space effect
            setLastSpaceEffect(moveResult.spaceEffect);
            
            // Handle special space effects
            if (moveResult.spaceEffect.type === 'shop') {
                setShowShop(true);
            } else if (moveResult.spaceEffect.type === 'chance') {
                setShowChanceEvent(moveResult.spaceEffect);
            } else if (moveResult.spaceEffect.type === 'minigame') {
                setShowMiniGame(true);
            }
            
            // Clear valid moves and selected space
            setValidMoves([]);
            setSelectedSpace(null);
            setDiceValue(null);
            
            // Check win condition
            const winner = boardManager.checkWinCondition(gameInstance.gameId);
            if (winner) {
                alert(`🎉 ${winner.name} wins the game! 🎉`);
            } else {
                // Move to next player
                boardManager.nextTurn(gameInstance.gameId);
            }
            
            // Update game stats
            const stats = boardManager.getGameStats(gameInstance.gameId);
            setGameStats(stats);
            
        } catch (error) {
            console.error('Move failed:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle chance event execution
    const executeChanceEvent = async (eventType) => {
        if (!gameInstance) return;

        try {
            const results = boardManager.executeChanceEvent(gameInstance.gameId, eventType);
            console.log('Chance event results:', results);
            
            setShowChanceEvent(null);
            
            // Update game stats
            const stats = boardManager.getGameStats(gameInstance.gameId);
            setGameStats(stats);
            
        } catch (error) {
            console.error('Chance event failed:', error);
            setError(error.message);
        }
    };

    // Purchase item from shop
    const purchaseItem = async (itemId) => {
        if (!gameInstance || !currentPlayer) return;

        try {
            const result = boardManager.purchaseItem(gameInstance.gameId, currentPlayer.id, itemId);
            
            if (result.success) {
                setShowShop(false);
                alert(`Purchased ${result.item.name}!`);
                
                // Update game stats
                const stats = boardManager.getGameStats(gameInstance.gameId);
                setGameStats(stats);
            }
            
        } catch (error) {
            console.error('Purchase failed:', error);
            setError(error.message);
        }
    };

    // Copy game code
    const copyGameCode = () => {
        navigator.clipboard.writeText(game.gameCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Leave game
    const handleLeaveGame = async () => {
        if (onLeaveGame) {
            onLeaveGame();
        }
    };

    // Get dice icon
    const getDiceIcon = (value) => {
        const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
        const Icon = icons[value - 1] || Dice1;
        return <Icon className="w-8 h-8" />;
    };

    if (loading && !board) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading party board...</div>
            </div>
        );
    }

    if (error && !board) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-xl">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20">
                <div className="flex items-center justify-between p-4">
                    {/* Game Info */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLeaveGame}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Leave Game</span>
                        </button>
                        
                        <div className="text-white">
                            <div className="font-bold text-lg">{board?.name || 'Party Board'}</div>
                            <div className="text-sm opacity-80">
                                Game Code: {game.gameCode}
                                <button
                                    onClick={copyGameCode}
                                    className="ml-2 text-blue-300 hover:text-blue-200"
                                >
                                    {copied ? '✓' : <Copy className="w-4 h-4 inline" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Player Stats */}
                    {currentPlayer && (
                        <div className="flex items-center space-x-6 text-white">
                            <div className="flex items-center space-x-2">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <span>{currentPlayer.stars}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Coins className="w-5 h-5 text-yellow-600" />
                                <span>{currentPlayer.coins}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Battery className="w-5 h-5 text-green-400" />
                                <span>{currentEnergy}/5</span>
                            </div>
                        </div>
                    )}

                    {/* Debug Toggle */}
                    <button
                        onClick={() => setShowDebugPanel(!showDebugPanel)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white"
                    >
                        Debug
                    </button>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex h-screen pt-20">
                {/* Game Board */}
                <div className="flex-1 relative">
                    {board && (
                        <PartyBoardRenderer
                            board={board}
                            boardManager={boardManager}
                            currentPlayer={currentPlayer}
                            game={game}
                            onSpaceClick={handleSpaceClick}
                            validMoves={validMoves}
                            selectedSpace={selectedSpace}
                        />
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-black bg-opacity-40 backdrop-blur-sm border-l border-white border-opacity-20 p-4 overflow-y-auto">
                    {/* Current Turn */}
                    <div className="mb-6">
                        <h3 className="text-white font-bold text-lg mb-3">Current Turn</h3>
                        {currentPlayer ? (
                            <div className="bg-white bg-opacity-10 rounded-lg p-3">
                                <div className="text-white font-medium">{currentPlayer.name}</div>
                                <div className="text-sm text-gray-300 mt-1">
                                    Turn {gameStats?.turnCount || 1} of {gameStats?.maxTurns || 20}
                                </div>
                                
                                {/* Dice Roll Button */}
                                {!diceValue && currentPlayer.id === user.uid && (
                                    <button
                                        onClick={handleDiceRoll}
                                        disabled={isRolling || currentEnergy < 1}
                                        className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center space-x-2"
                                    >
                                        {isRolling ? (
                                            <>
                                                <div className="animate-spin">🎲</div>
                                                <span>Rolling...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🎲</span>
                                                <span>Roll Dice</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                
                                {/* Dice Result */}
                                {diceValue && (
                                    <div className="mt-3 text-center">
                                        <div className="text-white mb-2">Rolled:</div>
                                        <div className="bg-white bg-opacity-20 rounded-lg p-3 flex items-center justify-center">
                                            {getDiceIcon(diceValue)}
                                            <span className="ml-2 text-xl font-bold text-white">{diceValue}</span>
                                        </div>
                                        {validMoves.length > 0 && (
                                            <div className="text-sm text-green-300 mt-2">
                                                Click a highlighted space to move!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-400">Waiting for players...</div>
                        )}
                    </div>

                    {/* Leaderboard */}
                    {gameStats?.leaderboard && (
                        <div className="mb-6">
                            <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                                Leaderboard
                            </h3>
                            <div className="space-y-2">
                                {gameStats.leaderboard.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className={`flex items-center justify-between p-2 rounded-lg ${
                                            player.id === currentPlayer?.id
                                                ? 'bg-blue-600 bg-opacity-50'
                                                : 'bg-white bg-opacity-10'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span className="text-white font-bold">#{player.rank}</span>
                                            <span className="text-white">{player.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-sm">
                                            <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4 text-yellow-400" />
                                                <span className="text-white">{player.stars}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Coins className="w-4 h-4 text-yellow-600" />
                                                <span className="text-white">{player.coins}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Player Items */}
                    {currentPlayer?.items && currentPlayer.items.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-white font-bold text-lg mb-3">Your Items</h3>
                            <div className="space-y-2">
                                {currentPlayer.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-white bg-opacity-10 rounded-lg p-3 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="text-white font-medium">{item.name}</div>
                                            <div className="text-sm text-gray-300">{item.effect}</div>
                                        </div>
                                        <button
                                            onClick={() => {/* Handle item use */}}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                                        >
                                            Use
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Events */}
                    {gameStats?.gameEvents && (
                        <div className="mb-6">
                            <h3 className="text-white font-bold text-lg mb-3">Recent Events</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {gameStats.gameEvents.slice(-5).reverse().map((event, index) => (
                                    <div
                                        key={index}
                                        className="bg-white bg-opacity-10 rounded-lg p-2 text-sm"
                                    >
                                        <div className="text-white">{event.type}</div>
                                        <div className="text-gray-300 text-xs">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Progress */}
                    <div className="mb-6">
                        <h3 className="text-white font-bold text-lg mb-3">Game Progress</h3>
                        <div className="bg-white bg-opacity-10 rounded-lg p-3">
                            <div className="flex justify-between text-white text-sm mb-2">
                                <span>Turn Progress</span>
                                <span>{gameStats?.turnCount || 0}/{gameStats?.maxTurns || 20}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((gameStats?.turnCount || 0) / (gameStats?.maxTurns || 20)) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Modal */}
            {showShop && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h2 className="text-white text-xl font-bold mb-4">🛍️ Item Shop</h2>
                        <div className="space-y-3">
                            {[
                                { id: 'mushroom', name: 'Mushroom', price: 5, effect: 'Extra dice roll' },
                                { id: 'star_pipe', name: 'Star Pipe', price: 15, effect: 'Warp to star' },
                                { id: 'coin_bag', name: 'Coin Bag', price: 8, effect: '10 extra coins' },
                                { id: 'swap_card', name: 'Swap Card', price: 12, effect: 'Swap positions' }
                            ].map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                                    <div>
                                        <div className="text-white font-medium">{item.name}</div>
                                        <div className="text-gray-300 text-sm">{item.effect}</div>
                                        <div className="text-yellow-400 text-sm">{item.price} coins</div>
                                    </div>
                                    <button
                                        onClick={() => purchaseItem(item.id)}
                                        disabled={!currentPlayer || currentPlayer.coins < item.price}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
                                    >
                                        Buy
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowShop(false)}
                            className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
                        >
                            Close Shop
                        </button>
                    </div>
                </div>
            )}

            {/* Chance Event Modal */}
            {showChanceEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-purple-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
                        <h2 className="text-white text-2xl font-bold mb-4">🎲 Chance Time!</h2>
                        <p className="text-white mb-6">{showChanceEvent.message}</p>
                        <button
                            onClick={() => executeChanceEvent(showChanceEvent.chanceEvent)}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold"
                        >
                            Spin the Wheel!
                        </button>
                    </div>
                </div>
            )}

            {/* Space Effect Modal */}
            {lastSpaceEffect && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
                        <h2 className="text-white text-xl font-bold mb-4">Space Effect</h2>
                        <p className="text-white mb-4">{lastSpaceEffect.message}</p>
                        {lastSpaceEffect.coins && (
                            <div className="text-yellow-400 text-lg mb-4">
                                {lastSpaceEffect.coins > 0 ? '+' : ''}{lastSpaceEffect.coins} coins
                            </div>
                        )}
                        {lastSpaceEffect.stars && (
                            <div className="text-yellow-300 text-lg mb-4">
                                {lastSpaceEffect.stars > 0 ? '+' : ''}{lastSpaceEffect.stars} stars
                            </div>
                        )}
                        <button
                            onClick={() => setLastSpaceEffect(null)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Debug Panel */}
            {showDebugPanel && (
                <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 rounded-lg p-4 max-w-md text-white text-sm z-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Debug Info</h3>
                        <button
                            onClick={() => setShowDebugPanel(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-1">
                        <div>Game ID: {game?.id}</div>
                        <div>Board: {board?.name}</div>
                        <div>Spaces: {board?.spaces?.length || 0}</div>
                        <div>Current Player: {currentPlayer?.name || 'None'}</div>
                        <div>Dice: {diceValue || 'Not rolled'}</div>
                        <div>Valid Moves: {validMoves.length}</div>
                        <div>Turn: {gameStats?.turnCount || 0}</div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg z-50">
                    {error}
                    <button
                        onClick={() => setError('')}
                        className="ml-4 text-red-200 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

export default PartyGameBoard;