import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [currentGame, setCurrentGame] = useState(null);
    const [gameSettings, setGameSettings] = useState({
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true
    });

    const value = {
        currentGame,
        setCurrentGame,
        gameSettings,
        setGameSettings
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export const useGameContext = () => useContext(GameContext);