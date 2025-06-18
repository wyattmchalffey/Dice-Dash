// src/components/GameBoard.js
import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, MapPin, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import { MassiveBoard } from './MassiveBoard';

const gameService = new GameService();

// NOTE: No changes were needed in the main GameBoard or Lobby component.
// All visual enhancements are in the AsyncMMOBoardGame sub-component below.
export function GameBoard({ game: initialGame, user, onLeaveGame }) {
    const [game, setGame] = useState(initialGame);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

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

    const isHost = game.hostId === user.uid;
    const canStartGame = isHost && game.status === 'waiting' && game.players.length >= 2;

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
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = game.gameCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const currentPlayer = game.players.find(p => p.userId === user.uid);

    if (game.boardId === 'massive' || game.boardId === 'mega') {
        const currentPlayer = game.players.find(p => p.userId === user.uid);
        // Render MassiveBoard for specific board types
        return (
            <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm z-10">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                Dice Dash - Massive World #{game.gameCode}
                            </h1>
                            <div className="text-white mt-1">Explore the vast, procedurally generated world!</div>
                        </div>
                        <button onClick={onLeaveGame} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                            Leave Game
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <MassiveBoard
                            game={game}
                            user={user}
                            currentPlayer={currentPlayer}
                            onMove={async (moveData) => {
                                try {
                                    await gameService.makeMove(game.id, user.uid, moveData);
                                } catch (error) {
                                    console.error('Failed to make move:', error);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (game.status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
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
                                            <div className={`w-12 h-12 rounded-full ${player.color} border-2 border-white flex items-center justify-center text-lg font-bold text-white`}>
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

    return (
        <AsyncMMOBoardGame
            game={game}
            user={user}
            onLeaveGame={onLeaveGame}
            gameService={gameService}
        />
    );
}

// --- VISUAL ENHANCEMENTS APPLIED TO THIS COMPONENT ---
function AsyncMMOBoardGame({ game, user, onLeaveGame, gameService }) {
    const [gameState, setGameState] = useState({
        diceValue: null,
        isRolling: false,
        pendingMove: null,
        showPathChoice: false,
        availablePaths: []
    });
    const [selectedSpace, setSelectedSpace] = useState(null);

    const boardSpaces = [
        { id: 0, x: 2, y: 12, type: 'start', name: 'Start', connections: [1] },
        { id: 1, x: 4, y: 12, type: 'blue', name: 'Blue Space', connections: [2] },
        { id: 2, x: 6, y: 12, type: 'red', name: 'Red Space', connections: [3] },
        { id: 3, x: 8, y: 12, type: 'blue', name: 'Blue Space', connections: [4, 5] },
        { id: 4, x: 6, y: 10, type: 'shop', name: 'Item Shop', connections: [6] },
        { id: 6, x: 4, y: 8, type: 'event', name: 'Event Space', connections: [8] },
        { id: 8, x: 2, y: 6, type: 'star', name: 'Star Space', connections: [10] },
        { id: 5, x: 10, y: 10, type: 'chance', name: 'Chance Space', connections: [7] },
        { id: 7, x: 12, y: 8, type: 'red', name: 'Red Space', connections: [9] },
        { id: 9, x: 14, y: 6, type: 'blue', name: 'Blue Space', connections: [11] },
        { id: 10, x: 4, y: 4, type: 'blue', name: 'Blue Space', connections: [12] },
        { id: 11, x: 12, y: 4, type: 'event', name: 'Event Space', connections: [13] },
        { id: 12, x: 6, y: 2, type: 'hub', name: 'Central Hub', connections: [14, 15, 16] },
        { id: 13, x: 10, y: 2, type: 'hub', name: 'Central Hub', connections: [14, 15, 16] },
        { id: 14, x: 8, y: 1, type: 'star', name: 'Star Space', connections: [17] },
        { id: 15, x: 4, y: 1, type: 'shop', name: 'Premium Shop', connections: [17] },
        { id: 16, x: 12, y: 1, type: 'chance', name: 'Chance Space', connections: [17] },
        { id: 17, x: 8, y: 0, type: 'final', name: 'Victory Circle', connections: [0] }
    ];

    const adjacencyMap = {};
    boardSpaces.forEach(space => {
        adjacencyMap[space.id] = space.connections || [];
    });

    const getSpaceColor = (type) => {
        switch (type) {
            case 'start': return 'bg-yellow-400';
            case 'blue': return 'bg-blue-400';
            case 'red': return 'bg-red-400';
            case 'star': return 'bg-yellow-500';
            case 'shop': return 'bg-green-400';
            case 'event': return 'bg-purple-400';
            case 'chance': return 'bg-orange-400';
            case 'hub': return 'bg-pink-500';
            case 'final': return 'bg-gradient-to-r from-purple-500 to-pink-500';
            default: return 'bg-gray-400';
        }
    };

    const getSpaceGradient = (type) => {
        switch (type) {
            case 'start': return '#fbbf24, #f59e0b';
            case 'blue': return '#60a5fa, #3b82f6';
            case 'red': return '#f87171, #ef4444';
            case 'star': return '#fde047, #facc15';
            case 'shop': return '#4ade80, #22c55e';
            case 'event': return '#c084fc, #a855f7';
            case 'chance': return '#fb923c, #f97316';
            case 'hub': return '#f472b6, #ec4899';
            case 'final': return '#a78bfa, #f472b6';
            default: return '#9ca3af, #6b7280';
        }
    };

    const getSpaceIcon = (type) => {
        const iconClass = "w-6 h-6 text-white drop-shadow-lg";
        switch (type) {
            case 'star': return <Star className={iconClass} />;
            case 'shop': return <Coins className={iconClass} />;
            case 'event': return <Trophy className={iconClass} />;
            case 'chance': return <MapPin className={iconClass} />;
            case 'hub': return <div className="w-3 h-3 bg-white rounded-full shadow-lg" />;
            case 'final': return <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-lg" />;
            default: return null;
        }
    };

    const getDiceIcon = (value) => {
        const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
        const DiceIcon = diceIcons[value - 1];
        return <DiceIcon className="w-8 h-8 text-white drop-shadow-md" />;
    };

    const getDirectionArrow = (from, to) => {
        const fromSpace = boardSpaces.find(s => s.id === from);
        const toSpace = boardSpaces.find(s => s.id === to);
        if (!fromSpace || !toSpace) return <ArrowRight className="w-4 h-4" />;
        const dx = toSpace.x - fromSpace.x;
        const dy = toSpace.y - fromSpace.y;
        if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />;
        else return dy > 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />;
    };

    const currentPlayer = game.players.find(p => p.userId === user.uid);
    const canRoll = currentPlayer && currentPlayer.energy >= 1 && !gameState.isRolling && !gameState.pendingMove;

    const rollDice = async () => {
        if (!canRoll) return;
        setGameState(prev => ({ ...prev, isRolling: true }));
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            setGameState(prev => ({ ...prev, diceValue: Math.floor(Math.random() * 6) + 1 }));
            rollCount++;
            if (rollCount >= 10) {
                clearInterval(rollInterval);
                const finalValue = Math.floor(Math.random() * 6) + 1;
                setGameState(prev => ({ ...prev, diceValue: finalValue, isRolling: false, pendingMove: finalValue }));
                setTimeout(() => checkForPathChoice(finalValue), 500);
            }
        }, 100);
    };

    const checkForPathChoice = (steps) => {
        const possibleDestinations = findPossibleMoves(currentPlayer.position, steps);
        if (possibleDestinations.length > 1) {
            setGameState(prev => ({ ...prev, showPathChoice: true, availablePaths: possibleDestinations }));
        } else if (possibleDestinations.length === 1) {
            movePlayerToPosition(possibleDestinations[0].position);
        } else {
            movePlayerToPosition(currentPlayer.position);
        }
    };

    const findPossibleMoves = (startPosition, steps) => {
        const visited = new Set();
        const paths = [];
        const explore = (currentPos, remainingSteps, path) => {
            if (remainingSteps === 0) {
                paths.push({ position: currentPos, path: [...path] });
                return;
            }
            const connections = adjacencyMap[currentPos] || [];
            connections.forEach(nextPos => {
                const key = `${nextPos}-${remainingSteps}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    explore(nextPos, remainingSteps - 1, [...path, nextPos]);
                }
            });
        };
        explore(startPosition, steps, [startPosition]);
        return paths.filter((path, index, self) => path.position !== startPosition && index === self.findIndex(p => p.position === path.position));
    };

    const choosePathAndMove = (destinationId) => {
        movePlayerToPosition(destinationId);
        setGameState(prev => ({ ...prev, showPathChoice: false, availablePaths: [] }));
    };

    const movePlayerToPosition = async (newPosition) => {
        let newCoins = currentPlayer.coins;
        let newStars = currentPlayer.stars;
        let newEnergy = Math.max(0, currentPlayer.energy - 1);
        if (newPosition !== currentPlayer.position) {
            const landedSpace = boardSpaces.find(s => s.id === newPosition);
            if (landedSpace) {
                if (landedSpace.type === 'blue') newCoins += 3;
                else if (landedSpace.type === 'red') newCoins = Math.max(0, newCoins - 3);
                else if (landedSpace.type === 'star' && newCoins >= 20) { newCoins -= 20; newStars += 1; }
                else if (landedSpace.type === 'event') {
                    if (Math.random() < 0.5) newCoins += 10;
                    else newEnergy = Math.min(currentPlayer.maxEnergy, newEnergy + 1);
                }
            }
        }
        try {
            await gameService.makeMove(game.id, user.uid, { newPosition, newCoins, newStars, newEnergy });
            setGameState(prev => ({ ...prev, diceValue: null, pendingMove: null }));
        } catch (error) {
            console.error('Failed to make move:', error);
            setGameState(prev => ({ ...prev, diceValue: null, pendingMove: null, isRolling: false }));
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 min-h-screen text-white">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-1 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent [text-shadow:0_2px_4px_rgba(0,0,0,0.4)]">
                            Dice Dash - #{game.gameCode}
                        </h1>
                    </div>
                    <button onClick={onLeaveGame} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg">
                        Leave Game
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                        {/* IMPROVED: Aspect ratio container for the board */}
                        <div className="relative w-full" style={{ paddingBottom: '75%' /* 4:3 Aspect Ratio */ }}>
                            <div className="absolute inset-0">
                                {/* IMPROVED: Thematic board background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-xl shadow-inner">
                                    <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
                                        <defs>
                                            <pattern id="sci-fi-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#sci-fi-grid)" />
                                    </svg>
                                </div>

                                {/* IMPROVED: Animated connection lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                                    <defs>
                                        <filter id="line-glow">
                                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>
                                    {boardSpaces.map((space) =>
                                        (space.connections || []).map((connectionId) => {
                                            const connectedSpace = boardSpaces.find(s => s.id === connectionId);
                                            if (!connectedSpace) return null;
                                            return (
                                                <line
                                                    key={`line-${space.id}-${connectionId}`}
                                                    x1={`${(space.x / 16) * 100}%`} y1={`${(space.y / 14) * 100}%`}
                                                    x2={`${(connectedSpace.x / 16) * 100}%`} y2={`${(connectedSpace.y / 14) * 100}%`}
                                                    stroke="rgba(200, 240, 255, 0.7)" strokeWidth="3" strokeDasharray="6, 6"
                                                    className="animate-pulse" filter="url(#line-glow)"
                                                />
                                            );
                                        })
                                    )}
                                </svg>

                                {/* IMPROVED: Board spaces with more effects */}
                                {boardSpaces.map((space) => {
                                    const leftPercent = (space.x / 16) * 100;
                                    const topPercent = (space.y / 14) * 100;
                                    return (
                                        <div
                                            key={space.id}
                                            className={`absolute rounded-full border-2 border-white/80 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 ${space.type === 'start' ? 'w-16 h-16' : 'w-14 h-14'}`}
                                            style={{
                                                left: `${leftPercent}%`, top: `${topPercent}%`, transform: 'translate(-50%, -50%)', zIndex: 20,
                                                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.3) 100%), linear-gradient(135deg, ${getSpaceGradient(space.type)})`,
                                                boxShadow: `0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)`
                                            }}
                                            onClick={() => setSelectedSpace(space)} title={`${space.name} (${space.id})`}
                                        >
                                            <div className="flex flex-col items-center justify-center">{getSpaceIcon(space.type)}
                                                {space.type === 'start' && (<span className="text-xs font-bold text-white mt-1 [text-shadow:0_1px_2px_#000]">START</span>)}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/50">{space.id}</div>
                                        </div>
                                    );
                                })}

                                {/* IMPROVED: Player tokens with glow effect */}
                                {game.players.map((player, index) => {
                                    const space = boardSpaces.find(s => s.id === player.position);
                                    if (!space) return null;
                                    const offsetX = (index % 2) * 16 - 8;
                                    const offsetY = Math.floor(index / 2) * 16 - 8;
                                    return (
                                        <div
                                            key={player.userId}
                                            className={`absolute w-8 h-8 rounded-full ${player.color} border-2 border-white flex items-center justify-center text-sm font-bold z-30 transition-all duration-500 ease-in-out`}
                                            style={{
                                                left: `${(space.x / 16) * 100}%`, top: `${(space.y / 14) * 100}%`,
                                                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                                                boxShadow: `0 0 12px 3px var(--player-color), 0 0 5px white`,
                                                '--player-color': player.color.startsWith('bg-') ? `var(--color-${player.color.replace('bg-', '').replace('-500', '')})` : player.color // Crude mapping for glow
                                            }}
                                            title={`${player.name} - Position ${player.position}`}
                                        >
                                            {player.name[0]}
                                        </div>
                                    );
                                })}

                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center bg-black/60 px-6 py-3 rounded-lg pointer-events-none border border-white/20 backdrop-blur-sm">
                                    <div className="text-lg font-bold [text-shadow:0_2px_4px_#000]">Dice Dash Board</div>
                                    <div className="text-sm opacity-80">Roll dice to move!</div>
                                </div>
                            </div>
                        </div>

                        {/* IMPROVED: Controls area */}
                        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <p className="text-lg font-semibold [text-shadow:0_1px_2px_#000]">Asynchronous Play - Move when you have energy!</p>
                                {gameState.diceValue && !gameState.isRolling && (
                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg animate-fade-in-down">
                                        {getDiceIcon(gameState.diceValue)}
                                        <span className="text-lg font-bold">Rolled: {gameState.diceValue}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-md bg-black/30 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-300" />
                                    <span>{Math.floor(currentPlayer?.energy || 0)} / {currentPlayer?.maxEnergy || 5}</span>
                                </div>
                                <button
                                    onClick={rollDice} disabled={!canRoll}
                                    className={`px-8 py-4 rounded-lg font-bold text-xl transition-all flex items-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none ${canRoll ? `bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:scale-105 transform ${!gameState.isRolling && 'animate-pulse'}` : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {gameState.isRolling ? 'Rolling...' : canRoll ? 'Roll Dice' : 'No Energy'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {gameState.showPathChoice && ( /* Modal remains largely the same, but benefits from global styles */
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
                                <h3 className="text-2xl font-bold mb-4 text-center text-yellow-300">Choose Your Path!</h3>
                                <p className="text-gray-300 mb-6 text-center">Multiple paths available with your roll of <span className="font-bold text-white">{gameState.diceValue}</span>.</p>
                                <div className="space-y-3">
                                    {gameState.availablePaths.map((path) => {
                                        const destinationSpace = boardSpaces.find(s => s.id === path.position);
                                        return (
                                            <button
                                                key={path.position} onClick={() => choosePathAndMove(path.position)}
                                                className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all flex items-center justify-between transform hover:scale-105"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white" style={{ background: `linear-gradient(135deg, ${getSpaceGradient(destinationSpace.type)})` }}>
                                                        {getSpaceIcon(destinationSpace.type)}
                                                    </div>
                                                    <div className="text-left"><div className="font-semibold">{destinationSpace.name}</div><div className="text-sm text-gray-400">Move to Space #{destinationSpace.id}</div></div>
                                                </div>
                                                {getDirectionArrow(currentPlayer.position, path.position)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* IMPROVED: Sidebar Panels */}
                <div className="space-y-4">
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Leaderboard</h3>
                        <div className="space-y-3">
                            {[...game.players].sort((a, b) => b.stars - a.stars || b.coins - a.coins).map((player) => (
                                <div key={player.userId} className={`p-3 rounded-lg border-2 bg-white/5 transition-all ${player.userId === user.uid ? 'border-blue-400 shadow-blue-400/30 shadow-lg' : 'border-white/20'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${player.color}`} /><span className="font-semibold">{player.name}</span><div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} title={player.isOnline ? 'Online' : 'Offline'} /></div>
                                        {player.userId === user.uid && (<span className="text-xs bg-blue-500 px-2 py-1 rounded text-white font-bold">YOU</span>)}
                                    </div>
                                    <div className="flex justify-between text-sm items-center"><span className="flex items-center gap-1.5" title="Coins"><Coins className="w-4 h-4 text-yellow-300" /> {player.coins}</span><span className="flex items-center gap-1.5" title="Stars"><Star className="w-4 h-4 text-yellow-400" /> {player.stars}</span><span className="flex items-center gap-1.5" title="Energy"><Zap className="w-4 h-4 text-blue-300" /> {Math.floor(player.energy)}</span></div>
                                    <div className="text-xs text-gray-400 mt-2">Position: {player.position}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {selectedSpace && (
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg animate-fade-in">
                            <h3 className="text-lg font-bold mb-2">{selectedSpace.name}</h3>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white mb-2" style={{ background: `linear-gradient(135deg, ${getSpaceGradient(selectedSpace.type)})` }}>{getSpaceIcon(selectedSpace.type)}</div>
                            <p className="text-sm text-gray-300 mb-2">
                                {selectedSpace.type === 'blue' && 'Gain 3 coins when landing here.'}
                                {selectedSpace.type === 'red' && 'Lose 3 coins when landing here.'}
                                {selectedSpace.type === 'star' && 'Buy a star for 20 coins.'}
                                {selectedSpace.type === 'shop' && 'Purchase items and power-ups.'}
                                {selectedSpace.type === 'event' && 'Trigger a random event - gain coins or energy!'}
                                {selectedSpace.type === 'chance' && 'Draw a chance card.'}
                                {selectedSpace.type === 'start' && 'Starting position for all players.'}
                                {selectedSpace.type === 'hub' && 'Major intersection with multiple paths.'}
                                {selectedSpace.type === 'final' && 'Victory circle - collect bonus and loop back!'}
                            </p>
                            {selectedSpace.connections && (<p className="text-xs text-gray-400">Connects to: {selectedSpace.connections.join(', ')}</p>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}