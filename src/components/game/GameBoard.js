// src/components/GameBoard.js
import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play, UserCheck, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, MapPin, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';

const gameService = new GameService();

export function GameBoard({ game: initialGame, user, onLeaveGame }) {
  const [game, setGame] = useState(initialGame);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Subscribe to real-time game updates
    const unsubscribe = gameService.subscribeToGame(game.id, (updatedGame) => {
      if (updatedGame) {
        setGame(updatedGame);
      }
    });

    // Update player online status
    gameService.updatePlayerStatus(game.id, user.uid, true);

    // Cleanup on unmount
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
      // Fallback for browsers that don't support clipboard API
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

  if (game.status === 'waiting') {
    // Game Lobby View
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
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
            {/* Game Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Game Code */}
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

              {/* Players */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players ({game.players.length}/{game.maxPlayers})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.players.map((player, index) => (
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
                  
                  {/* Empty slots */}
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

            {/* Game Controls */}
            <div className="space-y-6">
              {/* Start Game */}
              {isHost && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">Game Controls</h3>
                  {canStartGame ? (
                    <button
                      onClick={startGame}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        'Starting...'
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Start Game
                        </>
                      )}
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

              {/* Game Rules */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">How to Play</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Use energy to roll dice and move</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-green-400" />
                    <span>Collect coins from blue spaces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>Buy stars with 20 coins to win</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Energy regenerates over time</span>
                  </div>
                </div>
              </div>

              {/* Player Stats Preview */}
              {currentPlayer && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">Your Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Energy:</span>
                      <span className="text-white">{currentPlayer.energy}/{currentPlayer.maxEnergy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Coins:</span>
                      <span className="text-white">{currentPlayer.coins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Stars:</span>
                      <span className="text-white">{currentPlayer.stars}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If game is active, show the actual game board
  return (
    <AsyncMMOBoardGame 
      game={game}
      user={user}
      onLeaveGame={onLeaveGame}
      gameService={gameService}
    />
  );
}

// Integrated Board Game Component
function AsyncMMOBoardGame({ game, user, onLeaveGame, gameService }) {
  const [gameState, setGameState] = useState({
    diceValue: null,
    isRolling: false,
    pendingMove: null,
    showPathChoice: false,
    availablePaths: []
  });

  const [selectedSpace, setSelectedSpace] = useState(null);
  
  // Complex board layout with branching paths
  const boardSpaces = [
    // Bottom row - starting area
    { id: 0, x: 2, y: 12, type: 'start', name: 'Start', connections: [1] },
    { id: 1, x: 4, y: 12, type: 'blue', name: 'Blue Space', connections: [2] },
    { id: 2, x: 6, y: 12, type: 'red', name: 'Red Space', connections: [3] },
    { id: 3, x: 8, y: 12, type: 'blue', name: 'Blue Space', connections: [4, 5] }, // First split
    
    // Left path
    { id: 4, x: 6, y: 10, type: 'shop', name: 'Item Shop', connections: [6] },
    { id: 6, x: 4, y: 8, type: 'event', name: 'Event Space', connections: [8] },
    { id: 8, x: 2, y: 6, type: 'star', name: 'Star Space', connections: [10] },
    
    // Right path  
    { id: 5, x: 10, y: 10, type: 'chance', name: 'Chance Space', connections: [7] },
    { id: 7, x: 12, y: 8, type: 'red', name: 'Red Space', connections: [9] },
    { id: 9, x: 14, y: 6, type: 'blue', name: 'Blue Space', connections: [11] },
    
    // Paths converge
    { id: 10, x: 4, y: 4, type: 'blue', name: 'Blue Space', connections: [12] },
    { id: 11, x: 12, y: 4, type: 'event', name: 'Event Space', connections: [13] },
    
    // Central hub
    { id: 12, x: 6, y: 2, type: 'hub', name: 'Central Hub', connections: [14, 15, 16] },
    { id: 13, x: 10, y: 2, type: 'hub', name: 'Central Hub', connections: [14, 15, 16] },
    
    // Final paths
    { id: 14, x: 8, y: 1, type: 'star', name: 'Star Space', connections: [17] },
    { id: 15, x: 4, y: 1, type: 'shop', name: 'Premium Shop', connections: [17] },
    { id: 16, x: 12, y: 1, type: 'chance', name: 'Chance Space', connections: [17] },
    
    // Victory
    { id: 17, x: 8, y: 0, type: 'final', name: 'Victory Circle', connections: [0] }
  ];

  // Build adjacency map for pathfinding
  const adjacencyMap = {};
  boardSpaces.forEach(space => {
    adjacencyMap[space.id] = space.connections || [];
  });

  const getSpaceColor = (type) => {
    switch(type) {
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

  const getSpaceIcon = (type) => {
    switch(type) {
      case 'star': return <Star className="w-4 h-4 text-white" />;
      case 'shop': return <Coins className="w-4 h-4 text-white" />;
      case 'event': return <Trophy className="w-4 h-4 text-white" />;
      case 'chance': return <MapPin className="w-4 h-4 text-white" />;
      case 'hub': return <div className="w-2 h-2 bg-white rounded-full" />;
      case 'final': return <div className="w-3 h-3 bg-white rounded-full animate-pulse" />;
      default: return null;
    }
  };

  const getDiceIcon = (value) => {
    const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const DiceIcon = diceIcons[value - 1];
    return <DiceIcon className="w-8 h-8" />;
  };

  const getDirectionArrow = (from, to) => {
    const fromSpace = boardSpaces.find(s => s.id === from);
    const toSpace = boardSpaces.find(s => s.id === to);
    if (!fromSpace || !toSpace) return <ArrowRight className="w-4 h-4" />;
    
    const dx = toSpace.x - fromSpace.x;
    const dy = toSpace.y - fromSpace.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />;
    } else {
      return dy > 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />;
    }
  };

  const currentPlayer = game.players.find(p => p.userId === user.uid);
  const canRoll = currentPlayer && currentPlayer.energy >= 1 && !gameState.isRolling && !gameState.pendingMove;

  const rollDice = async () => {
    if (!canRoll) return;
    
    setGameState(prev => ({ ...prev, isRolling: true }));
    
    // Simulate dice roll animation
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setGameState(prev => ({ ...prev, diceValue: Math.floor(Math.random() * 6) + 1 }));
      rollCount++;
      
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setGameState(prev => ({
          ...prev,
          diceValue: finalValue,
          isRolling: false,
          pendingMove: finalValue
        }));
        
        // Check if player needs to choose a path
        setTimeout(() => checkForPathChoice(finalValue), 500);
      }
    }, 100);
  };

  const checkForPathChoice = (steps) => {
    const possibleDestinations = findPossibleMoves(currentPlayer.position, steps);
    
    if (possibleDestinations.length > 1) {
      setGameState(prev => ({
        ...prev,
        showPathChoice: true,
        availablePaths: possibleDestinations
      }));
    } else if (possibleDestinations.length === 1) {
      movePlayerToPosition(possibleDestinations[0].position);
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
    
    // Remove duplicates and starting position
    const uniquePaths = paths.filter((path, index, self) =>
      path.position !== startPosition &&
      index === self.findIndex(p => p.position === path.position)
    );
    
    return uniquePaths;
  };

  const choosePathAndMove = (destinationId) => {
    movePlayerToPosition(destinationId);
    setGameState(prev => ({
      ...prev,
      showPathChoice: false,
      availablePaths: []
    }));
  };

  const movePlayerToPosition = async (newPosition) => {
    const playerIndex = game.players.findIndex(p => p.userId === user.uid);
    let newCoins = currentPlayer.coins;
    let newStars = currentPlayer.stars;
    let newEnergy = Math.max(0, currentPlayer.energy - 1);
    
    // Process space landing
    const landedSpace = boardSpaces.find(s => s.id === newPosition);
    if (landedSpace) {
      if (landedSpace.type === 'blue') {
        newCoins += 3;
      } else if (landedSpace.type === 'red') {
        newCoins = Math.max(0, newCoins - 3);
      } else if (landedSpace.type === 'star') {
        if (newCoins >= 20) {
          newCoins -= 20;
          newStars += 1;
        }
      } else if (landedSpace.type === 'event') {
        // Random event
        const eventOutcome = Math.random();
        if (eventOutcome < 0.5) {
          newCoins += 10;
        } else {
          newEnergy = Math.min(currentPlayer.maxEnergy, newEnergy + 1);
        }
      }
    }

    // Make the move via the game service
    try {
      await gameService.makeMove(game.id, user.uid, {
        newPosition: newPosition,
        newCoins: newCoins,
        newStars: newStars,
        newEnergy: newEnergy,
        // Remove nextTurn since it's async now
      });

      setGameState(prev => ({
        ...prev,
        diceValue: null,
        pendingMove: null
      }));
    } catch (error) {
      console.error('Failed to make move:', error);
      // Reset state on error
      setGameState(prev => ({
        ...prev,
        diceValue: null,
        pendingMove: null,
        isRolling: false
      }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 min-h-screen text-white">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Dice Dash - Game #{game.gameCode}
            </h1>
            <div className="text-center text-lg">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Zap className="w-5 h-5" />
                Energy: {Math.floor(currentPlayer?.energy || 0)}/{currentPlayer?.maxEnergy || 5}
              </span>
            </div>
          </div>
          <button
            onClick={onLeaveGame}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Leave Game
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            {/* Debug Info */}
            <div className="mb-4 text-sm text-gray-300">
              Debug: {boardSpaces.length} spaces loaded | Current player position: {currentPlayer?.position}
            </div>
            
            <div className="relative w-full h-96 bg-green-600 rounded-lg p-4 border-2 border-white">
              {/* Simple test circles to verify rendering */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                T1
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                T2
              </div>
              <div className="absolute bottom-4 left-4 w-8 h-8 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                T3
              </div>
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white">
                T4
              </div>
              
              {/* Board Spaces */}
              {boardSpaces.map((space) => {
                const leftPercent = (space.x / 16) * 100;
                const topPercent = (space.y / 14) * 100;
                
                return (
                  <div
                    key={space.id}
                    className={`absolute w-10 h-10 rounded-full ${getSpaceColor(space.type)} border-2 border-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg z-20`}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => setSelectedSpace(space)}
                    title={`${space.name} (${space.id}) - ${space.x},${space.y}`}
                  >
                    {getSpaceIcon(space.type)}
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-black/80 px-1 rounded">
                      {space.id}
                    </span>
                  </div>
                );
              })}
              
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {boardSpaces.map((space) => 
                  (space.connections || []).map((connectionId) => {
                    const connectedSpace = boardSpaces.find(s => s.id === connectionId);
                    if (!connectedSpace) return null;
                    
                    return (
                      <line
                        key={`line-${space.id}-${connectionId}`}
                        x1={`${(space.x / 16) * 100}%`}
                        y1={`${(space.y / 14) * 100}%`}
                        x2={`${(connectedSpace.x / 16) * 100}%`}
                        y2={`${(connectedSpace.y / 14) * 100}%`}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    );
                  })
                )}
              </svg>
              
              {/* Player Tokens */}
              {game.players.map((player, index) => {
                const space = boardSpaces.find(s => s.id === player.position);
                if (!space) {
                  console.log(`Player ${player.name} at position ${player.position} - space not found`);
                  return null;
                }
                
                const offsetX = (index % 2) * 16 - 8;
                const offsetY = Math.floor(index / 2) * 16 - 8;
                
                return (
                  <div
                    key={player.userId}
                    className={`absolute w-8 h-8 rounded-full ${player.color} border-2 border-white flex items-center justify-center text-sm font-bold z-30 shadow-lg`}
                    style={{
                      left: `${(space.x / 16) * 100}%`,
                      top: `${(space.y / 14) * 100}%`,
                      transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`
                    }}
                    title={`${player.name} - Position ${player.position}`}
                  >
                    {player.name[0]}
                  </div>
                );
              })}
              
              {/* Center info */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center bg-black/50 px-4 py-2 rounded">
                <div className="text-lg font-bold">Dice Dash Board</div>
                <div className="text-sm">Roll dice to move!</div>
              </div>
            </div>
            
            {/* Dice and Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold">
                  Asynchronous Play - Move when you have energy!
                </div>
                {gameState.diceValue && (
                  <div className="flex items-center gap-2">
                    {getDiceIcon(gameState.diceValue)}
                    <span>Rolled: {gameState.diceValue}</span>
                  </div>
                )}
                {gameState.pendingMove && !gameState.showPathChoice && (
                  <div className="text-yellow-400 font-semibold animate-pulse">
                    Moving {gameState.pendingMove} spaces...
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
                  Energy: {Math.floor(currentPlayer?.energy || 0)}/{currentPlayer?.maxEnergy || 5}
                </div>
                <button
                  onClick={rollDice}
                  disabled={!canRoll}
                  className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                    canRoll 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {gameState.isRolling ? 'Rolling...' : 
                   !currentPlayer ? 'Loading...' :
                   currentPlayer.energy < 1 ? 'No Energy' :
                   `Roll Dice (1 ⚡)`}
                  {!gameState.isRolling && canRoll && getDiceIcon(3)}
                </button>
              </div>
            </div>
          </div>

          {/* Path Choice Modal */}
          {gameState.showPathChoice && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
                <h3 className="text-xl font-bold mb-4 text-center">Choose Your Path!</h3>
                <p className="text-gray-300 mb-4 text-center">
                  Multiple paths available with your roll of {gameState.diceValue}
                </p>
                <div className="space-y-3">
                  {gameState.availablePaths.map((path, index) => {
                    const destinationSpace = boardSpaces.find(s => s.id === path.position);
                    return (
                      <button
                        key={path.position}
                        onClick={() => choosePathAndMove(path.position)}
                        className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getSpaceColor(destinationSpace.type)} border-2 border-white flex items-center justify-center`}>
                            {getSpaceIcon(destinationSpace.type)}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">{destinationSpace.name}</div>
                            <div className="text-sm text-gray-400">Space #{destinationSpace.id}</div>
                          </div>
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

        {/* Player List and Info */}
        <div className="space-y-4">
          {/* Players */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players
            </h3>
            <div className="space-y-3">
              {game.players.map((player, index) => (
                <div
                  key={player.userId}
                  className="p-3 rounded-lg border-2 border-white/20 bg-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${player.color}`} />
                      <span className="font-semibold">{player.name}</span>
                      <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                    </div>
                    {player.userId === user.uid && (
                      <span className="text-xs bg-blue-500 px-2 py-1 rounded text-white">YOU</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {player.coins}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {player.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {Math.floor(player.energy)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Position: {player.position}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Space Info */}
          {selectedSpace && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold mb-2">{selectedSpace.name}</h3>
              <div className={`w-8 h-8 rounded-full ${getSpaceColor(selectedSpace.type)} border-2 border-white flex items-center justify-center mb-2`}>
                {getSpaceIcon(selectedSpace.type)}
              </div>
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
              {selectedSpace.connections && (
                <div>
                  <p className="text-xs text-gray-400">
                    Connects to: {selectedSpace.connections.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Game Status */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-bold mb-2">Game Status</h3>
            <div className="space-y-2 text-sm">
              <div className="text-green-400 font-semibold">🚀 Asynchronous Play Active</div>
              <div>• Roll dice anytime you have energy</div>
              <div>• Energy regenerates over time</div>
              <div>• Choose paths at intersections</div>
              <div>• First to collect stars wins!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}