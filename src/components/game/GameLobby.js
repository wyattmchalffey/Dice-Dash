// src/components/GameLobby.js
import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { gameConfig } from '../../config/game-config';
import { Plus, Users, Clock, LogOut, Settings, Map as MapIcon } from 'lucide-react';

const gameService = new GameService();

export function GameLobby({ user, onJoinGame, onSignOut }) {
  const [games, setGames] = useState([]);
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [boardType, setBoardType] = useState('classic');
  const [gameMode, setGameMode] = useState('classic');

  useEffect(() => {
    loadUserGames();
  }, [user]);

  const loadUserGames = async () => {
    try {
      const userGames = await gameService.getUserGames(user.uid);
      setGames(userGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

    const createNewGame = async () => {
        setLoading(true);
        setError('');
        try {
            const settings = {
                boardId: boardType,
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

    setLoading(true);
    setError('');

    try {
      const gameId = await gameService.joinGameByCode(gameCode.toUpperCase(), user);
      // Reload games to see the newly joined game
      await loadUserGames();
      
      // Find and join the game
      const updatedGames = await gameService.getUserGames(user.uid);
      const joinedGame = updatedGames.find(g => g.id === gameId);
      if (joinedGame) {
        onJoinGame(joinedGame);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setGameCode('');
    }
  };

  const joinExistingGame = (game) => {
    onJoinGame(game);
  };

  const getGameStatusText = (game) => {
    if (game.status === 'waiting') {
      return `Waiting for players (${game.players.length}/${game.maxPlayers})`;
    } else if (game.status === 'active') {
      return 'Game in progress';
    } else {
      return 'Game completed';
    }
  };

  const getGameStatusColor = (game) => {
    if (game.status === 'waiting') return 'text-yellow-400';
    if (game.status === 'active') return 'text-green-400';
    return 'text-gray-400';
  };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Dice Dash</h1>
                        <p className="text-gray-300 mt-2">Welcome, {user.displayName}!</p>
                    </div>
                    <button onClick={onSignOut} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">{error}</div>}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Create Game */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Create New Game</h2>

                        {/* NEW: Game Creation Settings */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2"><MapIcon className="w-4 h-4" />Board Type</label>
                                <select value={boardType} onChange={(e) => setBoardType(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none">
                                    {Object.values(gameConfig.boards).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2"><Settings className="w-4 h-4" />Game Mode</label>
                                <select value={gameMode} onChange={(e) => setGameMode(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none">
                                    {Object.entries(gameConfig.gameModes).map(([id, mode]) => <option key={id} value={id}>{id.charAt(0).toUpperCase() + id.slice(1)} ({mode.maxPlayers} players)</option>)}
                                </select>
                            </div>
                        </div>

                        <button onClick={createNewGame} disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Game'}
                        </button>
                    </div>

          {/* Join Game */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Join Game
            </h2>
            <p className="text-gray-300 mb-4">
              Enter a game code to join an existing game.
            </p>
            <form onSubmit={joinGameByCode} className="space-y-3">
              <input
                type="text"
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading || !gameCode.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </form>
          </div>
        </div>

        {/* Your Games */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Your Games
          </h2>

          {games.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No games yet!</p>
              <p className="text-gray-500">Create a new game or join one with a game code.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">Game #{game.gameCode}</h3>
                        <span className={`text-sm ${getGameStatusColor(game)}`}>
                          {getGameStatusText(game)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {game.players.length} players
                        </span>
                        <span>Host: {game.hostName}</span>
                        {game.createdAt && (
                          <span>
                            Created: {new Date(game.createdAt.toDate()).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Players preview */}
                      <div className="flex items-center gap-2 mt-3">
                        {game.players.slice(0, 4).map((player, index) => (
                          <div
                            key={player.userId}
                            className={`w-8 h-8 rounded-full ${player.color} border-2 border-white flex items-center justify-center text-xs font-bold text-white`}
                            title={player.name}
                          >
                            {player.name[0]}
                          </div>
                        ))}
                        {game.players.length > 4 && (
                          <div className="text-xs text-gray-400">
                            +{game.players.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => joinExistingGame(game)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all"
                      >
                        {game.status === 'waiting' ? 'Enter Lobby' : 'Continue Game'}
                      </button>
                      
                      {game.status === 'waiting' && (
                        <div className="text-xs text-gray-400 text-center">
                          Code: {game.gameCode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}