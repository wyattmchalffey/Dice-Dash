// src/components/game/GameLobby.js
// Enhanced GameLobby with energy system integration and theme selection

import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { gameConfig } from '../../config/game-config';
import { BOARD_THEMES } from '../../systems/board-system';
import { Plus, Users, Clock, LogOut, Settings, Map as MapIcon, Battery, Star, Crown } from 'lucide-react';

const gameService = new GameService();

export function GameLobby({ user, onJoinGame, onSignOut, energySystem, boardSystem, playerProfile }) {
  const [games, setGames] = useState([]);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [boardType, setBoardType] = useState('classic_plains');
  const [gameMode, setGameMode] = useState('classic');
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);

  useEffect(() => {
    loadUserGames();
    updateEnergyDisplay();
    
    // Listen for energy updates
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
    // Check energy before creating game
    if (!energySystem.canTakeAction(user.uid, 1)) {
      setShowEnergyWarning(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const settings = {
        boardId: boardType,
        theme: boardType,
        maxPlayers: 200, // MMO Party Quest supports 200+ players
        ...gameConfig.gameModes[gameMode]
      };
      
      const game = await gameService.createGame(user, settings);
      setGames(prev => [game, ...prev]);
      
      // Join the game (this will consume energy in parent component)
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

    // Check energy before joining
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
    // Check energy before joining
    if (!energySystem.canTakeAction(user.uid, 1)) {
      setShowEnergyWarning(true);
      return;
    }
    
    onJoinGame(game);
  };

  // Get available board themes based on player level
const getAvailableThemes = () => {
    const playerLevel = playerProfile?.level || 1;
    return Object.values(BOARD_THEMES).filter(theme => 
        !theme.unlockLevel || playerLevel >= theme.unlockLevel
    );
};

  // Get theme display info
const getThemeInfo = (themeId) => {
    const matchingTheme = Object.values(BOARD_THEMES).find(
        theme => theme.id === themeId || theme.id === themeId?.toLowerCase()
    );
    return matchingTheme || BOARD_THEMES.CLASSIC_PLAINS;
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Energy Status */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
              Game Lobby
            </h1>
            <p className="text-gray-300">Choose your adventure in Dice Dash</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Energy Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  Energy: {currentEnergy}/5
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Required to play: 1 energy
              </div>
            </div>

            <button 
              onClick={onSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2 inline" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Energy Warning Modal */}
        {showEnergyWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="text-center">
                <Battery className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">Not Enough Energy!</h3>
                <p className="text-gray-300 mb-6">
                  You need at least 1 energy to play. Your energy will regenerate over time, 
                  or you can watch an ad or make a purchase.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEnergyWarning(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowEnergyWarning(false);
                      // This would trigger the energy panel in the parent
                      window.dispatchEvent(new CustomEvent('showEnergyPanel'));
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Get Energy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Create Game Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> 
              Create New Game
            </h2>

            {/* Game Creation Settings */}
            <div className="space-y-4 mb-6">
              
              {/* Board Theme Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
                  <MapIcon className="w-4 h-4" />
                  Board Theme
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {getAvailableThemes().map(theme => (
                    <div 
                      key={theme.id}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        boardType === theme.id 
                          ? 'border-yellow-400 bg-yellow-400/20' 
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                      onClick={() => setBoardType(theme.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{theme.name}</h3>
                          <p className="text-gray-400 text-sm">{theme.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Crown className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-gray-400">Level {theme.unlockLevel}+</span>
                            </div>
                            {theme.specialFeatures && (
                              <div className="text-xs text-blue-400">
                                • {theme.specialFeatures.slice(0, 2).join(' • ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div 
                          className="w-12 h-12 rounded-lg"
                          style={{ backgroundColor: theme.backgroundColor }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Mode Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4" />
                  Game Mode
                </label>
                <select 
                  value={gameMode} 
                  onChange={(e) => setGameMode(e.target.value)} 
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  {Object.entries(gameConfig.gameModes).map(([id, mode]) => (
                    <option key={id} value={id} className="bg-gray-800">
                      {id.charAt(0).toUpperCase() + id.slice(1)} - Up to {mode.maxPlayers} players
                    </option>
                  ))}
                </select>
              </div>

              {/* Energy Cost Display */}
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-200">
                  <Battery className="w-4 h-4" />
                  <span className="text-sm font-semibold">Energy Cost: 1</span>
                </div>
                <p className="text-xs text-yellow-300 mt-1">
                  You'll need 1 energy to create and join this game
                </p>
              </div>
            </div>

            <button 
              onClick={createNewGame} 
              disabled={loading || currentEnergy < 1} 
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                currentEnergy >= 1 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Creating...' : currentEnergy < 1 ? 'Need More Energy' : 'Create Game'}
            </button>
          </div>

          {/* Join Game Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Join Game
            </h2>
            
            {/* Join by Code */}
            <form onSubmit={joinGameByCode} className="mb-6">
              <label className="text-sm font-semibold text-gray-300 mb-2 block">
                Game Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter game code..."
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                  maxLength={6}
                />
                <button 
                  type="submit" 
                  disabled={loading || !gameCode.trim() || currentEnergy < 1}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    currentEnergy >= 1 && gameCode.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Join
                </button>
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Your Games List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Your Games</h3>
              {games.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No games yet. Create your first game above!
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {games.map((game) => (
                    <div key={game.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold">
                              {getThemeInfo(game.theme || game.boardId).name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300' :
                              game.status === 'active' ? 'bg-green-500/20 text-green-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {game.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {game.players.length}/{game.maxPlayers || 20}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(game.createdAt.seconds * 1000).toLocaleDateString()}
                            </span>
                            <span className="font-mono text-yellow-400">
                              #{game.gameCode}
                            </span>
                          </div>
                        </div>
                        
                        {game.status !== 'finished' && (
                          <button 
                            onClick={() => handleJoinExistingGame(game)}
                            disabled={currentEnergy < 1}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              currentEnergy >= 1
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {game.status === 'waiting' ? 'Join' : 'Resume'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}