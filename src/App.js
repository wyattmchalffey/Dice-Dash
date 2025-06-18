// src/App.js
import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { GameLobby } from './components/game/GameLobby';
import { GameBoard } from './components/game/GameBoard';
import { AdminPanel } from './components/admin/AdminPanel';
import { AuthService } from './services/auth-service';
import './App.css';

const authService = new AuthService();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // User state will be updated by the auth listener
  };

  const handleJoinGame = (game) => {
    setCurrentGame(game);
  };

  const handleLeaveGame = () => {
    setCurrentGame(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentGame) {
    return (
      <GameBoard 
        game={currentGame} 
        user={user} 
        onLeaveGame={handleLeaveGame} 
      />
    );
  }

  return (
    <GameLobby 
      user={user} 
      onJoinGame={handleJoinGame}
      onSignOut={() => authService.signOut()}
    />
  );
}

export default App;