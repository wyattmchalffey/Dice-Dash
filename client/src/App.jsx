import React, { useState, useEffect } from 'react';
import './App.css';
import MainMenu from './ui/screens/MainMenu';
import GameView from './ui/screens/GameView';
import { SocketManager } from './network/SocketManager';
import { GameAPI } from './network/GameAPI';

function App() {
  const [gameState, setGameState] = useState('menu'); // menu, connecting, playing
  const [playerData, setPlayerData] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);
  const [socketManager, setSocketManager] = useState(null);

  useEffect(() => {
    // Check for existing session
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      validateSession(sessionId);
    }
  }, []);

  const validateSession = async (sessionId) => {
    try {
      const data = await GameAPI.validateSession(sessionId);
      if (data.valid) {
        setPlayerData(data.user);
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      localStorage.removeItem('sessionId');
    }
  };

  const handleLogin = async (playerName) => {
    try {
      const data = await GameAPI.login(playerName);
      setPlayerData(data.user);
      localStorage.setItem('sessionId', data.sessionId);
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  const handleJoinGame = async (roomId = null) => {
    if (!playerData) {
      setError('Please login first');
      return;
    }

    setGameState('connecting');
    setError(null);

    try {
      // Create socket connection
      const manager = new SocketManager();
      await manager.connect();
      
      // Join game
      const gameData = await manager.joinGame(playerData.name, roomId);
      
      setSocketManager(manager);
      setRoomData(gameData);
      setGameState('playing');
      
      // Set up event listeners
      manager.on('gameStateUpdate', (data) => {
        setRoomData(prevData => ({ ...prevData, ...data }));
      });
      
    } catch (error) {
      console.error('Failed to join game:', error);
      setError(error.message);
      setGameState('menu');
    }
  };

  const handleLeaveGame = () => {
    if (socketManager) {
      socketManager.disconnect();
      setSocketManager(null);
    }
    setRoomData(null);
    setGameState('menu');
  };

  const handleLogout = async () => {
    try {
      await GameAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('sessionId');
    setPlayerData(null);
    handleLeaveGame();
  };

  return (
    <div className="App">
      {gameState === 'menu' && (
        <MainMenu
          playerData={playerData}
          onLogin={handleLogin}
          onJoinGame={handleJoinGame}
          onLogout={handleLogout}
          error={error}
        />
      )}
      
      {gameState === 'connecting' && (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>Connecting to game...</h2>
        </div>
      )}
      
      {gameState === 'playing' && roomData && (
        <GameView
          playerData={playerData}
          roomData={roomData}
          socketManager={socketManager}
          onLeaveGame={handleLeaveGame}
        />
      )}
    </div>
  );
}

export default App;