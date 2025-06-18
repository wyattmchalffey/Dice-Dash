// src/components/admin/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { AdminUtils } from '../../utils/admin-utils';
import { Trash2, RefreshCw, Database, AlertTriangle } from 'lucide-react';

export function AdminPanel({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const gameStats = await AdminUtils.getGameStats();
      setStats(gameStats);
    } catch (error) {
      setMessage('Failed to load stats: ' + error.message);
    }
  };

  const handleClearAllGames = async () => {
    if (!window.confirm('Are you sure you want to delete ALL games? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const count = await AdminUtils.clearAllGames();
      setMessage(`Successfully deleted ${count} games`);
      await loadStats();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOldGames = async () => {
    if (!window.confirm('Delete all games older than 7 days?')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const count = await AdminUtils.clearOldGames(7);
      setMessage(`Successfully deleted ${count} old games`);
      await loadStats();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearWaitingGames = async () => {
    if (!window.confirm('Delete all waiting games?')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const count = await AdminUtils.clearGamesByStatus('waiting');
      setMessage(`Successfully deleted ${count} waiting games`);
      await loadStats();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Only show admin panel to authorized users
  // You should implement proper admin authentication
  const isAdmin = user?.email === 'wyattmchalffey2@gmail.com'; // Change this!
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-black/90 text-white rounded-lg shadow-lg">
        <summary className="cursor-pointer p-4 flex items-center gap-2 hover:bg-gray-800 rounded-lg">
          <Database className="w-5 h-5" />
          Admin Panel
        </summary>
        
        <div className="p-4 space-y-4 min-w-[300px]">
          {/* Stats */}
          {stats && (
            <div className="bg-gray-800 rounded p-3 space-y-1 text-sm">
              <h3 className="font-bold mb-2">Game Statistics</h3>
              <div>Total Games: {stats.total}</div>
              <div>Waiting: {stats.waiting}</div>
              <div>Active: {stats.active}</div>
              <div>Completed: {stats.completed}</div>
              <div>Total Players: {stats.totalPlayers}</div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Stats
            </button>

            <button
              onClick={handleClearWaitingGames}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear Waiting Games
            </button>

            <button
              onClick={handleClearOldGames}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Clear Old Games (7+ days)
            </button>

            <button
              onClick={handleClearAllGames}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Clear ALL Games
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`text-sm p-2 rounded ${
              message.includes('Error') ? 'bg-red-600' : 'bg-green-600'
            }`}>
              {message}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}