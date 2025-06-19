// src/components/game/GameBoard.js
import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play } from 'lucide-react';
import EnhancedGameBoard from './EnhancedGameBoard';
import { BoardManager, EnhancedBoardGenerator, BOARD_THEMES } from '../../systems/board-system';

const gameService = new GameService();

export function GameBoard({ game: initialGame, user, onLeaveGame }) {
    const [game, setGame] = useState(initialGame);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // State for the board and its manager
    const [board, setBoard] = useState(null);
    const [boardManager, setBoardManager] = useState(null);

    // KEY FIX #1: This useEffect is now solely responsible for board generation.
    // It runs only when the game becomes 'active' and the board hasn't been created yet.
    useEffect(() => {
        // Guard Clause: If the game isn't active or if the board already exists, do nothing.
        // This is the most important part to prevent re-generation.
        if (game.status !== 'active' || board) {
            return;
        }

        console.log("GAME_BOARD_EFFECT: Game is active and board is null. Generating now...");

        // --- Board Generation Logic ---
        const theme = BOARD_THEMES[game.boardTheme || 'JUNGLE_ADVENTURE'];
        const generator = new EnhancedBoardGenerator(theme);
        const generatedBoard = generator.generateMassiveBoard(10, 10, game.maxPlayers || 20);
        const manager = new BoardManager(generatedBoard);
        
        console.log("GAME_BOARD_EFFECT: Board and Manager created in memory.");

        // --- Player Position Initialization ---
        // Crucially, we do this *before* setting the state.
        game.players.forEach((player, index) => {
            const spawnZone = generatedBoard.spawnZones[index % generatedBoard.spawnZones.length];
            // Find a valid starting space within the spawn zone
            const startSpace = generatedBoard.spaces.find(s =>
                Math.abs(s.x - spawnZone.x) < 5 && Math.abs(s.y - spawnZone.y) < 5
            );
            if (startSpace) {
                console.log(`GAME_BOARD_EFFECT: Placing player ${player.name} at space ${startSpace.id}`);
                manager.updatePlayerPosition(player.userId, startSpace.id);
            } else {
                console.warn(`GAME_BOARD_EFFECT: Could not find start space for player ${player.name} in zone ${index}`);
            }
        });

        // --- Set State ---
        // This triggers the re-render that will show the board.
        console.log("GAME_BOARD_EFFECT: Setting state with new board and manager.");
        setBoard(generatedBoard);
        setBoardManager(manager);

    }, [game.status, game.id]); // Depend on the whole 'game' object and 'board' to correctly trigger the guard clause.


    // This effect handles subscribing to real-time game updates from the service.
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
    }, [game.id, user.uid]); // This should only run once per game/user.

    const isHost = game.hostId === user.uid;
    const canStartGame = isHost && game.status === 'waiting' && game.players.length >= 2;
    const currentPlayer = game.players.find(p => p.userId === user.uid);

    const startGame = async () => {
        setLoading(true);
        setError('');
        try {
            // This service call will update the game status to 'active' in the backend,
            // which will then be picked up by the subscription, triggering the board generation effect.
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

    const handlePlayerMove = async (spaceId) => {
        // Implementation remains the same...
    };

    const handleDiceRoll = async (diceValue) => {
        // Implementation remains the same...
    };

    // --- RENDER LOGIC ---

    // Waiting Room UI (No changes needed here)
    if (game.status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
                {/* ... The entire lobby JSX ... */}
                 <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onLeaveGame}
                                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Lobby
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
                                <p className="text-gray-300">Waiting for players to join...</p>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                <h2 className="text-xl font-bold text-white mb-4">Game Code</h2>
                                <div className="flex items-center gap-4">
                                    <div className="bg-black/30 px-6 py-4 rounded-lg font-mono text-3xl font-bold text-yellow-400 tracking-widest">
                                        {game.gameCode}
                                    </div>
                                    <button
                                        onClick={copyGameCode}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-gray-300 mt-3">
                                    Share this code with friends so they can join your game!
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Players ({game.players.length}/{game.maxPlayers})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {game.players.map((player) => (
                                        <div
                                            key={player.userId}
                                            className="bg-white/5 border border-white/20 rounded-lg p-4 flex items-center gap-3"
                                        >
                                            <div style={{ backgroundColor: player.color || '#cccccc' }} className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-lg font-bold text-white`}>
                                                {player.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">{player.name}</span>
                                                    {player.userId === game.hostId && (
                                                        <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                                                            HOST
                                                        </span>
                                                    )}
                                                    {player.userId === user.uid && (
                                                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                                                    <span className="text-sm text-gray-300">
                                                        {player.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {Array.from({ length: game.maxPlayers - game.players.length }, (_, index) => (
                                        <div
                                            key={`empty-${index}`}
                                            className="bg-white/5 border border-white/10 border-dashed rounded-lg p-4 flex items-center justify-center"
                                        >
                                            <span className="text-gray-500">Waiting for player...</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {isHost && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                    <h3 className="text-lg font-bold text-white mb-4">Game Controls</h3>
                                    {canStartGame ? (
                                        <button
                                            onClick={startGame}
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Starting...' : <><Play className="w-5 h-5" />Start Game</>}
                                        </button>
                                    ) : (
                                        <div className="text-center">
                                            <div className="bg-gray-600 text-gray-300 py-3 rounded-lg font-semibold mb-2">
                                                Need at least 2 players
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                Wait for more players to join before starting the game.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                <h3 className="text-lg font-bold text-white mb-4">How to Play</h3>
                                <div className="space-y-3 text-sm text-gray-300">
                                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /><span>Use energy to roll dice and move</span></div>
                                    <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-green-400" /><span>Collect coins from blue spaces</span></div>
                                    <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /><span>Buy stars with 20 coins to win</span></div>
                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /><span>Energy regenerates over time</span></div>
                                </div>
                            </div>
                            {currentPlayer && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                    <h3 className="text-lg font-bold text-white mb-4">Your Stats</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between"><span className="text-gray-300">Energy:</span><span className="text-white">{currentPlayer.energy}/{currentPlayer.maxEnergy}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-300">Coins:</span><span className="text-white">{currentPlayer.coins}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-300">Stars:</span><span className="text-white">{currentPlayer.stars}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // KEY FIX #2: The active game rendering logic.
    // It now correctly checks for the existence of board and boardManager.
    return (
        <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm z-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Dice Dash - #{game.gameCode}
                        </h1>
                        <div className="text-white mt-1">
                            Theme: {board?.theme?.name || 'Loading...'}
                        </div>
                    </div>
                    <button onClick={onLeaveGame} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Leave Game
                    </button>
                </div>
                <div className="flex-1 relative">
                    {board && boardManager ? (
                        <EnhancedGameBoard
                            game={game}
                            board={board}
                            boardManager={boardManager}
                            currentPlayer={currentPlayer}
                            onPlayerMove={handlePlayerMove}
                            onDiceRoll={handleDiceRoll}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-white text-xl animate-pulse">Generating massive board...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}