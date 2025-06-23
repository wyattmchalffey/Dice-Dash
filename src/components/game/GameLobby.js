// src/components/game/GameLobby.js
// Simplified GameLobby with focus on single magical kingdom theme

import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { gameConfig } from '../../config/game-config';
import { BOARD_THEMES } from '../../systems/board-system';
import { Plus, Users, Clock, LogOut, Settings, Sparkles, Battery, Star, Crown, Zap } from 'lucide-react';

const gameService = new GameService();

export function GameLobby({ user, onJoinGame, onSignOut, energySystem, boardSystem, playerProfile }) {
  const [games, setGames] = useState([]);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameMode, setGameMode] = useState('classic');
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);

  useEffect(() => {
    loadUserGames();
    updateEnergyDisplay();
    
    const handleEnergyUpdate = () => updateEnergyDisplay();
    window.addEventListener('energyUpdated', handleEnergyUpdate);
    
    return () => window.removeEventListener('energyUpdated', handleEnergyUpdate);
  }, [user]);

  const updateEnergyDisplay = () => {
    if (energySystem && user) {
      setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
    }
  };

  const loadUserGames = async () => {
    try {
      const userGames = await gameService.getUserGames(user.uid);
      setGames(userGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const createNewGame = async () => {
    if (!energySystem.canTakeAction(user.uid, 1)) {
      setShowEnergyWarning(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const settings = {
        boardId: 'magical_kingdom',
        theme: 'magical_kingdom',
        maxPlayers: gameConfig.gameModes[gameMode].maxPlayers,
        ...gameConfig.gameModes[gameMode]
      };
      
      const game = await gameService.createGame(user, settings);
      setGames(prev => [game, ...prev]);
      
      onJoinGame(game);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const joinGameByCode = async (e) => {
    e.preventDefault();
    if (!gameCode.trim()) return;

    if (!energySystem.canTakeAction(user.uid, 1)) {
      setShowEnergyWarning(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameId = await gameService.joinGameByCode(gameCode.toUpperCase(), user);
      await loadUserGames();
      
      const updatedGames = await gameService.getUserGames(user.uid);
      const joinedGame = updatedGames.find(g => g.id === gameId);
      
      if (joinedGame) {
        onJoinGame(joinedGame);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExistingGame = (game) => {
    if (!energySystem.canTakeAction(user.uid, 1)) {
      setShowEnergyWarning(true);
      return;
    }
    
    onJoinGame(game);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      {/* Magical particles background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-yellow-400" />
              Magical Kingdom
            </h1>
            <p className="text-gray-300">Welcome back, {user.displayName}!</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Energy Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">{currentEnergy}/5</span>
              <span className="text-gray-300 text-sm">Energy</span>
            </div>
            
            {/* Player Stats */}
            {playerProfile && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">Level {playerProfile.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <span className="text-white">{playerProfile.totalStars || 0}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={onSignOut}
              className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create/Join Game Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Start Your Adventure
            </h2>

            {/* Create Game Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Create New Game</h3>
              
              {/* Game Mode Selection */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4" />
                  Select Game Mode
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(gameConfig.gameModes).map(([id, mode]) => (
                    <button
                      key={id}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        gameMode === id 
                          ? 'border-yellow-400 bg-yellow-400/20' 
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                      onClick={() => setGameMode(id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">{mode.name}</h4>
                          <p className="text-gray-400 text-sm mt-1">{mode.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {mode.maxPlayers} players
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {mode.starGoal} stars to win
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {mode.turnLimit} turns
                            </span>
                          </div>
                        </div>
                        {gameMode === id && (
                          <div className="text-yellow-400">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createNewGame}
                disabled={loading || currentEnergy < 1}
                className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 ${
                  loading || currentEnergy < 1
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Magical Kingdom
                  </>
                )}
              </button>
            </div>

            {/* Join Game Section */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Join Existing Game</h3>
              <form onSubmit={joinGameByCode} className="flex gap-2">
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter game code"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={loading || !gameCode.trim() || currentEnergy < 1}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    loading || !gameCode.trim() || currentEnergy < 1
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Join
                </button>
              </form>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Energy Warning */}
            {showEnergyWarning && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-500 text-yellow-100 px-4 py-3 rounded-lg">
                <p className="flex items-center gap-2">
                  <Battery className="w-5 h-5" />
                  Not enough energy! Wait for regeneration or purchase more.
                </p>
              </div>
            )}
          </div>

          {/* Your Games List */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Crown className="w-6 h-6 text-purple-400" />
              Your Active Games
            </h2>

            {games.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 text-lg">No active games yet</p>
                <p className="text-gray-500 text-sm mt-2">Create a new game to begin your magical adventure!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {games.map((game) => (
                  <div 
                    key={game.id} 
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold">
                            Magical Kingdom
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300' :
                            game.status === 'active' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {game.status === 'waiting' ? 'Waiting' : 
                             game.status === 'active' ? 'In Progress' : 'Finished'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {game.players?.length || 0}/{game.maxPlayers || 4}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(game.createdAt?.toDate?.() || game.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-mono bg-white/10 px-2 py-1 rounded">
                            {game.gameCode}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinExistingGame(game)}
                        disabled={currentEnergy < 1}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                          currentEnergy < 1
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                        }`}
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Featured Content */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome to the Magical Kingdom</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Collect Stars</h3>
              <p className="text-gray-400 text-sm">Navigate the magical board and collect stars to win!</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Special Powers</h3>
              <p className="text-gray-400 text-sm">Use magical items and abilities to gain an advantage!</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Play Together</h3>
              <p className="text-gray-400 text-sm">Compete with friends in this magical party adventure!</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}