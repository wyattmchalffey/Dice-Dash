import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config/GameConfig';
import './GameView.css';

function GameView({ playerData, roomData, socketManager, onLeaveGame }) {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);

  useEffect(() => {
    // Initialize Phaser game
    if (!phaserGameRef.current && gameRef.current) {
      const config = {
        ...gameConfig,
        parent: gameRef.current,
        scene: {
          ...gameConfig.scene,
          // Pass data to scenes
          init: function(data) {
            this.socketManager = socketManager;
            this.playerData = playerData;
            this.roomData = roomData;
          }
        }
      };
      
      phaserGameRef.current = new Phaser.Game(config);
      
      // Start with the board scene
      phaserGameRef.current.scene.start('BoardScene', {
        socketManager,
        playerData,
        roomData
      });
    }

    // Cleanup on unmount
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="game-view">
      <div className="game-header">
        <div className="room-info">
          <span className="room-code">Room: {roomData.roomId}</span>
          <span className="player-count">
            Players: {roomData.players?.length || 0}/8
          </span>
        </div>
        
        <button className="leave-button" onClick={onLeaveGame}>
          Leave Game
        </button>
      </div>
      
      <div ref={gameRef} id="game-container" className="game-container" />
      
      <div className="game-footer">
        <div className="chat-section">
          <ChatBox socketManager={socketManager} playerData={playerData} />
        </div>
        
        <div className="emotes-section">
          <EmoteSelector socketManager={socketManager} />
        </div>
      </div>
    </div>
  );
}

// Simple chat component
function ChatBox({ socketManager, playerData }) {
  const [messages, setMessages] = React.useState([]);
  const [inputValue, setInputValue] = React.useState('');
  const chatRef = React.useRef(null);

  React.useEffect(() => {
    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, {
        playerName: data.playerName,
        message: data.message,
        timestamp: data.timestamp
      }]);
    };

    socketManager.on('chat_message', handleChatMessage);
    
    return () => {
      socketManager.off('chat_message', handleChatMessage);
    };
  }, [socketManager]);

  React.useEffect(() => {
    // Auto-scroll to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      socketManager.sendChatMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={chatRef}>
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span className="chat-player">{msg.playerName}:</span>
            <span className="chat-text">{msg.message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

// Simple emote selector
function EmoteSelector({ socketManager }) {
  const emotes = ['😊', '😢', '😠', '😂', '🤔'];

  const sendEmote = (emote) => {
    socketManager.sendEmote(emote);
  };

  return (
    <div className="emote-selector">
      <p>Quick Emotes:</p>
      <div className="emote-buttons">
        {emotes.map((emote, index) => (
          <button
            key={index}
            className="emote-button"
            onClick={() => sendEmote(emote)}
          >
            {emote}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GameView;