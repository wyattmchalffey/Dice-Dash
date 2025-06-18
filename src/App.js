// src/App.js
import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { GameLobby } from './components/game/GameLobby';
import { GameBoard } from './components/game/GameBoard';
import { AdminPanel } from './components/admin/AdminPanel';
import { AuthService } from './services/auth-service';
import { useGameContext } from './contexts/GameContext'; // <-- IMPORT CONTEXT HOOK
import './App.css';

const authService = new AuthService();

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // MODIFIED: Use context for game state
    const { currentGame, setCurrentGame } = useGameContext();

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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

    // The main layout of the app
    const renderContent = () => {
        if (!user) {
            return <AuthScreen onAuthSuccess={() => { /* Listener handles it */ }} />;
        }
        if (currentGame) {
            return <GameBoard game={currentGame} user={user} onLeaveGame={handleLeaveGame} />;
        }
        return <GameLobby user={user} onJoinGame={handleJoinGame} onSignOut={() => authService.signOut()} />;
    };

    return (
        <div className="App">
            {renderContent()}
            {/* NEW: Render the Admin Panel for the authorized user */}
            {user && <AdminPanel user={user} />}
        </div>
    );
}

export default App;