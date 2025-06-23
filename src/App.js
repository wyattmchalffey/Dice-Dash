// src/App.js
// Updated App component to use the new party-style board system

import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { GameLobby } from './components/game/GameLobby';
import GameBoard from './components/game/GameBoard';
import { AdminPanel } from './components/admin/AdminPanel';
import { EnergyDisplay, EnergyStatusIndicator } from './components/ui/EnergyDisplay';
import { AuthService } from './services/auth-service';
import { EnergySystem } from './systems/energy-system';
import { ProgressionSystem } from './systems/progression-system';
import { MiniGameSystem } from './systems/mini-game-system';
import { BoardManager } from './systems/board-manager'; 
import { useGameContext } from './contexts/GameContext';
import { Battery, User, Star, Gamepad2, Home, Users, ShoppingBag, Settings, Trophy } from 'lucide-react';
import './App.css';

// Initialize services and systems
const authService = new AuthService();
const energySystem = new EnergySystem();
const progressionSystem = new ProgressionSystem();
const miniGameSystem = new MiniGameSystem();
const boardSystem = new BoardManager(); 

// Placeholder components for features not yet implemented
const CharacterSheet = ({ user, playerProfile, progressionSystem, onProfileUpdate }) => (
    <div className="text-center py-20">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Character Sheet</h2>
        <p className="text-gray-400 mb-6">Manage your skills, achievements, and progression</p>
        <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
            {playerProfile && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Level:</span>
                        <span className="text-white font-bold text-xl">{playerProfile.level}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">XP:</span>
                        <span className="text-white font-bold">{playerProfile.xp}/{playerProfile.xpToNext}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Games Played:</span>
                        <span className="text-white">{playerProfile.gamesPlayed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Stars Collected:</span>
                        <span className="text-yellow-400">{playerProfile.totalStars}</span>
                    </div>
                </div>
            )}
        </div>
        <button 
            onClick={() => onProfileUpdate && onProfileUpdate()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
            Update Profile
        </button>
    </div>
);

const ItemShop = ({ user, playerProfile, onPurchase }) => (
    <div className="text-center py-20">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Item Shop</h2>
        <p className="text-gray-400 mb-6">Purchase power-ups and cosmetics for your games</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
                { name: 'Extra Energy', price: 100, description: 'Gain +1 max energy' },
                { name: 'Lucky Dice', price: 50, description: 'Higher chance of rolling 6' },
                { name: 'Star Finder', price: 200, description: 'Reveals star locations' },
                { name: 'Coin Magnet', price: 75, description: 'Gain more coins from spaces' }
            ].map((item, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                    <div className="flex justify-between items-center">
                        <span className="text-yellow-400 font-bold">{item.price} coins</span>
                        <button 
                            onClick={() => onPurchase && onPurchase(item)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                        >
                            Buy
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Leaderboards = () => (
    <div className="text-center py-20">
        <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Leaderboards</h2>
        <p className="text-gray-400 mb-6">See how you rank against other players</p>
        <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-white font-bold mb-4">Top Players This Week</h3>
                <div className="space-y-2">
                    {[
                        { rank: 1, name: 'PartyMaster2024', stars: 47, games: 23 },
                        { rank: 2, name: 'DiceRoller99', stars: 41, games: 18 },
                        { rank: 3, name: 'StarCollector', stars: 38, games: 21 },
                        { rank: 4, name: 'LuckyPlayer', stars: 35, games: 16 },
                        { rank: 5, name: 'BoardWalker', stars: 32, games: 19 }
                    ].map((player) => (
                        <div key={player.rank} className="flex justify-between items-center py-2 border-b border-gray-600">
                            <div className="flex items-center space-x-3">
                                <span className="text-yellow-400 font-bold">#{player.rank}</span>
                                <span className="text-white">{player.name}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="text-yellow-300">{player.stars} ⭐</span>
                                <span className="text-gray-300">{player.games} games</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const SettingsPanel = ({ user, onSignOut }) => (
    <div className="text-center py-20">
        <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Settings</h2>
        <p className="text-gray-400 mb-6">Customize your game experience</p>
        <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-white font-bold mb-3">Game Settings</h3>
                <div className="space-y-3">
                    <label className="flex items-center justify-between">
                        <span className="text-gray-300">Sound Effects</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                        <span className="text-gray-300">Music</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                        <span className="text-gray-300">Animations</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                        <span className="text-gray-300">Notifications</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                </div>
            </div>
            <button 
                onClick={onSignOut}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium"
            >
                Sign Out
            </button>
        </div>
    </div>
);

function App() {
    const [currentScreen, setCurrentScreen] = useState('auth');
    const [user, setUser] = useState(null);
    const [currentGame, setCurrentGame] = useState(null);
    const [playerProfile, setPlayerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Initialize player profile when user changes
    useEffect(() => {
        if (user) {
            const profile = progressionSystem.getPlayerProfile(user.uid);
            setPlayerProfile(profile);
        }
    }, [user]);

    // Check for existing authentication on app load
    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                setCurrentScreen('lobby');
            } else {
                setUser(null);
                setCurrentScreen('auth');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAuthSuccess = () => {
        // This is just called to indicate auth completed
        // The actual user state is handled by onAuthStateChanged above
        console.log('Auth completed');
    };

    const handleSignOut = async () => {
        try {
            await authService.signOut();
            setUser(null);
            setCurrentGame(null);
            setPlayerProfile(null);
            setCurrentScreen('auth');
        } catch (error) {
            console.error('Sign out failed:', error);
            setError(error.message);
        }
    };

    const handleJoinGame = (game) => {
        setCurrentGame(game);
        setCurrentScreen('game');
    };

    const handleLeaveGame = () => {
        setCurrentGame(null);
        setCurrentScreen('lobby');
    };

    const handleNavigation = (screen) => {
        setCurrentScreen(screen);
    };

    const updatePlayerProfile = () => {
        if (user) {
            const profile = progressionSystem.getPlayerProfile(user.uid);
            setPlayerProfile(profile);
        }
    };

    const handleItemPurchase = (item) => {
        // Implement item purchase logic
        console.log('Purchasing item:', item);
        alert(`Purchased ${item.name} for ${item.price} coins!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading Game...</div>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen onAuthSuccess={handleAuthSuccess} authService={authService} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            {/* Navigation Bar */}
            {currentScreen !== 'game' && (
                <nav className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo and Title */}
                            <div className="flex items-center space-x-3">
                                <Gamepad2 className="w-8 h-8 text-blue-400" />
                                <div>
                                    <h1 className="text-white font-bold text-xl">Dice Dash</h1>
                                    <p className="text-blue-300 text-xs">The Ultimate Board Game Experience</p>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleNavigation('lobby')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        currentScreen === 'lobby' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Lobby</span>
                                </button>
                                <button
                                    onClick={() => handleNavigation('character')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        currentScreen === 'character' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    <User className="w-4 h-4" />
                                    <span>Character</span>
                                </button>
                                <button
                                    onClick={() => handleNavigation('shop')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        currentScreen === 'shop' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Shop</span>
                                </button>
                                <button
                                    onClick={() => handleNavigation('leaderboards')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        currentScreen === 'leaderboards' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    <Trophy className="w-4 h-4" />
                                    <span>Leaderboards</span>
                                </button>
                                <button
                                    onClick={() => handleNavigation('settings')}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                        currentScreen === 'settings' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </button>
                            </div>

                            {/* User Info and Energy */}
                            <div className="flex items-center space-x-4">
                                <EnergyStatusIndicator 
                                    currentEnergy={energySystem.getCurrentEnergy(user.uid)}
                                    maxEnergy={energySystem.maxEnergy}
                                />
                                <div className="text-white">
                                    <div className="font-medium">{user.displayName}</div>
                                    {playerProfile && (
                                        <div className="text-xs text-blue-300">Level {playerProfile.level}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            )}

            {/* Main Content */}
            <main className="flex-1">
                {currentScreen === 'lobby' && (
                    <GameLobby
                        user={user}
                        onJoinGame={handleJoinGame}
                        energySystem={energySystem}
                        playerProfile={playerProfile}
                    />
                )}

                {currentScreen === 'game' && currentGame && (
                    <GameBoard
                        game={currentGame}
                        user={user}
                        onLeaveGame={handleLeaveGame}
                        energySystem={energySystem}
                        progressionSystem={progressionSystem}
                        miniGameSystem={miniGameSystem}
                        boardSystem={boardSystem}
                    />
                )}

                {currentScreen === 'character' && (
                    <CharacterSheet
                        user={user}
                        playerProfile={playerProfile}
                        progressionSystem={progressionSystem}
                        onProfileUpdate={updatePlayerProfile}
                    />
                )}

                {currentScreen === 'shop' && (
                    <ItemShop
                        user={user}
                        playerProfile={playerProfile}
                        onPurchase={handleItemPurchase}
                    />
                )}

                {currentScreen === 'leaderboards' && <Leaderboards />}

                {currentScreen === 'settings' && (
                    <SettingsPanel user={user} onSignOut={handleSignOut} />
                )}

                {currentScreen === 'admin' && user?.isAdmin && (
                    <AdminPanel
                        authService={authService}
                        energySystem={energySystem}
                        progressionSystem={progressionSystem}
                    />
                )}
            </main>

            {/* Error Display */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
                    {error}
                    <button
                        onClick={() => setError('')}
                        className="ml-4 text-red-200 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;