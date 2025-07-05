import React, { useState } from 'react';
import './MainMenu.css';

function MainMenu({ playerData, onLogin, onJoinGame, onLogout, error }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    setIsLoading(true);
    const success = await onLogin(playerName);
    setIsLoading(false);
    
    if (success) {
      setPlayerName('');
    }
  };

  const handleQuickPlay = () => {
    onJoinGame();
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      onJoinGame(roomCode.toUpperCase());
    }
  };

  return (
    <div className="main-menu">
      <div className="menu-card">
        <h1 className="game-title">Dice Dash</h1>
        <p className="game-subtitle">Roll, Race, and Rule the Board!</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {!playerData ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !playerName.trim()}
            >
              {isLoading ? 'Connecting...' : 'Play'}
            </button>
          </form>
        ) : (
          <div className="logged-in-menu">
            <div className="player-info">
              <h3>Welcome, {playerData.name}!</h3>
              <div className="stats">
                <div className="stat">
                  <span className="stat-label">Games Played:</span>
                  <span className="stat-value">{playerData.stats?.gamesPlayed || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Coins:</span>
                  <span className="stat-value">{playerData.stats?.totalCoins || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="menu-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleQuickPlay}
              >
                Quick Play
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => setShowJoinRoom(!showJoinRoom)}
              >
                Join Room
              </button>
              
              {showJoinRoom && (
                <div className="join-room-section">
                  <input
                    type="text"
                    placeholder="Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <button 
                    className="btn"
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim()}
                  >
                    Join
                  </button>
                </div>
              )}
              
              <button 
                className="btn btn-secondary"
                onClick={() => console.log('Leaderboard')}
              >
                Leaderboard
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => console.log('Shop')}
              >
                Shop
              </button>
              
              <button 
                className="btn logout-btn"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        )}
        
        <div className="footer">
          <p>© 2024 Dice Dash - Demo Version</p>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;