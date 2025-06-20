// src/App.js
// Working App component with existing imports and placeholder components

import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { GameLobby } from './components/game/GameLobby';
import { GameBoard } from './components/game/GameBoard';
import { AdminPanel } from './components/admin/AdminPanel';
import { EnergyDisplay, EnergyStatusIndicator } from './components/ui/EnergyDisplay';
import { AuthService } from './services/auth-service';
import { EnergySystem } from './systems/energy-system';
import { ProgressionSystem } from './systems/progression-system';
import { MiniGameSystem } from './systems/mini-game-system';
import { EnhancedBoardSystem } from './systems/enhanced-board-system';
import { useGameContext } from './contexts/GameContext';
import { Battery, User, Star, Gamepad2, Home, Users, ShoppingBag, Settings } from 'lucide-react';
import './App.css';

// Initialize services and systems
const authService = new AuthService();
const energySystem = new EnergySystem();
const progressionSystem = new ProgressionSystem();
const miniGameSystem = new MiniGameSystem();
const boardSystem = new EnhancedBoardSystem();

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
                        <span className="text-white">{playerProfile.xp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Skill Points:</span>
                        <span className="text-purple-400 font-bold">{playerProfile.skillPoints}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Achievements:</span>
                        <span className="text-yellow-400">{playerProfile.achievements}/{playerProfile.totalAchievements}</span>
                    </div>
                </div>
            )}
        </div>
        <p className="text-gray-500 text-sm mt-4">Coming Soon: Skill Trees & Achievement Gallery</p>
    </div>
);

const CollectionsPanel = ({ user, progressionSystem }) => (
    <div className="text-center py-20">
        <Star className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Collections</h2>
        <p className="text-gray-400 mb-6">Customize your character with skins, dice, and emotes</p>
        <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-gray-700 rounded-lg aspect-square flex items-center justify-center">
                        <span className="text-gray-500">Item {i}</span>
                    </div>
                ))}
            </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">Coming Soon: Character Skins, Dice Designs & Emotes</p>
    </div>
);

const PersonalIsland = ({ user, playerProfile }) => (
    <div className="text-center py-20">
        <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Personal Island</h2>
        <p className="text-gray-400 mb-6">Build and customize your private island</p>
        <div className="bg-white/10 rounded-lg p-6 max-w-lg mx-auto aspect-video flex items-center justify-center">
            <div className="text-center">
                <div className="w-32 h-32 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Home className="w-16 h-16 text-white" />
                </div>
                <p className="text-gray-300">Your island awaits!</p>
            </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">Coming Soon: Island Building & Decoration</p>
    </div>
);

const SocialHub = ({ user, energySystem, progressionSystem }) => (
    <div className="text-center py-20">
        <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Social Hub</h2>
        <p className="text-gray-400 mb-6">Connect with friends and join guilds</p>
        <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
            <div className="space-y-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors">
                    Add Friends
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors">
                    Join Guild
                </button>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors">
                    Send Energy Gift
                </button>
            </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">Coming Soon: Friends List, Guilds & Leaderboards</p>
    </div>
);

const GameStore = ({ user, energySystem, onEnergyPurchase }) => (
    <div className="text-center py-20">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Game Store</h2>
        <p className="text-gray-400 mb-6">Purchase energy, cosmetics, and convenience items</p>
        <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
            <div className="space-y-4">
                {energySystem.getEnergyPurchaseOptions().map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onEnergyPurchase(option)}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
                    >
                        <span>{option.label}</span>
                        <span>${option.price}</span>
                    </button>
                ))}
            </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">Coming Soon: Character Skins, Dice Designs & More</p>
    </div>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lobby'); // lobby, game, character, collections, island, social, shop
    const [showEnergyPanel, setShowEnergyPanel] = useState(false);
    const [playerEnergy, setPlayerEnergy] = useState(5);
    const [playerProfile, setPlayerProfile] = useState(null);
    
    // Use context for game state
    const { currentGame, setCurrentGame } = useGameContext();

    // Initialize app
    useEffect(() => {
        console.log("Setting up global listeners and auth subscription...");
        const handleNotification = (event) => {
            const { message, type } = event.detail;

            // Simple notification display (you can make this fancier)
            console.log(`Notification (${type}): ${message}`);

            // You could also show a toast notification here
        };
        window.addEventListener('showNotification', handleNotification);

        const handleShowEnergyPanel = () => {
            setShowEnergyPanel(true);
        };

        const unsubscribe = authService.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);

            if (user) {
                // User is logged IN
                initializePlayerSystems(user);

                // Add user-specific listeners
                window.addEventListener('showEnergyPanel', handleShowEnergyPanel);

            } else {
                window.removeEventListener('showEnergyPanel', handleShowEnergyPanel);
            }
        });

        // --- MAIN CLEANUP FUNCTION ---
        // This runs only when the component unmounts.
        return () => {
            console.log("Cleaning up all listeners and auth subscription.");

            // Cleanup all subscriptions and listeners
            unsubscribe(); // Stops listening to auth changes
            window.removeEventListener('showNotification', handleNotification);
            window.removeEventListener('showEnergyPanel', handleShowEnergyPanel); // Important for cleanup on unmount
        };
    }, []);

    // Initialize player-specific systems
    const initializePlayerSystems = (user) => {
        // Load player progression data
        progressionSystem.loadSpecificPlayerData(user.uid);
        const profile = progressionSystem.getPlayerProfile(user.uid);
        setPlayerProfile(profile);
        
        // Initialize energy
        const energy = energySystem.getCurrentEnergy(user.uid);
        setPlayerEnergy(energy);
        
        // Check daily bonus
        const dailyBonus = progressionSystem.getDailyBonus(user.uid);
        if (dailyBonus) {
            // Show notification for daily bonus
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: `Daily bonus: +${dailyBonus} XP!`, type: 'success' }
            }));
        }
        
        // Set up energy monitoring
        const updateEnergy = () => {
            if (user) {
                setPlayerEnergy(energySystem.getCurrentEnergy(user.uid));
            }
        };
        
        const energyInterval = setInterval(updateEnergy, 5000);
        window.addEventListener('energyUpdated', updateEnergy);
        
        return () => {
            clearInterval(energyInterval);
            window.removeEventListener('energyUpdated', updateEnergy);
        };
    };

    // Handle game joining with energy check
    const handleJoinGame = async (game) => {
        if (!energySystem.canTakeAction(user.uid, 1)) {
            setShowEnergyPanel(true);
            return;
        }
        
        // Spend energy to join game
        try {
            energySystem.spendEnergy(user.uid, 1);
            setCurrentGame(game);
            setActiveTab('game');
            
            // Award XP for game participation
            progressionSystem.awardActionXP(user.uid, 'game_completed');
        } catch (error) {
            console.error('Failed to join game:', error);
            setShowEnergyPanel(true);
        }
    };

    const handleLeaveGame = () => {
        setCurrentGame(null);
        setActiveTab('lobby');
    };

    // Handle energy purchase
    const handleEnergyPurchase = (option) => {
        // In a real app, this would integrate with payment processing
        console.log('Energy purchase:', option);
        
        // For demo, just add the energy
        energySystem.addEnergy(user.uid, option.energy || 5, 'purchase');
        setShowEnergyPanel(false);
        
        // Show success notification
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: `Purchased ${option.label}!`, type: 'success' }
        }));
    };

    // Handle ad watching
    const handleWatchAd = async () => {
        try {
            await energySystem.watchAdForEnergy(user.uid);
            setShowEnergyPanel(false);
            
            // Show success notification
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: 'Thanks for watching! +1 Energy', type: 'success' }
            }));
        } catch (error) {
            console.error('Failed to watch ad:', error);
        }
    };

    // Handle tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        
        // Award XP for exploring different features
        if (tab !== 'lobby' && tab !== 'game') {
            progressionSystem.awardActionXP(user.uid, 'space_visited', { spaceType: tab });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading MMO Party Quest...</div>
            </div>
        );
    }

    // Render auth screen if not logged in
    if (!user) {
        return <AuthScreen onAuthSuccess={() => { /* Listener handles it */ }} />;
    }

    // Main navigation tabs
    const navigationTabs = [
        { id: 'lobby', name: 'Lobby', icon: Gamepad2 },
        { id: 'character', name: 'Character', icon: User },
        { id: 'collections', name: 'Collections', icon: Star },
        { id: 'island', name: 'Island', icon: Home },
        { id: 'social', name: 'Social', icon: Users },
        { id: 'shop', name: 'Shop', icon: ShoppingBag }
    ];

    // Render main content based on active tab
    const renderMainContent = () => {
        switch (activeTab) {
            case 'game':
                return (
                    <GameBoard 
                        game={currentGame} 
                        user={user} 
                        onLeaveGame={handleLeaveGame}
                        // Pass systems to existing GameBoard - it may not use them yet
                        energySystem={energySystem}
                        progressionSystem={progressionSystem}
                        miniGameSystem={miniGameSystem}
                        boardSystem={boardSystem}
                    />
                );
            case 'character':
                return (
                    <CharacterSheet 
                        user={user}
                        playerProfile={playerProfile}
                        progressionSystem={progressionSystem}
                        onProfileUpdate={setPlayerProfile}
                    />
                );
            case 'collections':
                return (
                    <CollectionsPanel 
                        user={user}
                        progressionSystem={progressionSystem}
                    />
                );
            case 'island':
                return (
                    <PersonalIsland 
                        user={user}
                        playerProfile={playerProfile}
                    />
                );
            case 'social':
                return (
                    <SocialHub 
                        user={user}
                        energySystem={energySystem}
                        progressionSystem={progressionSystem}
                    />
                );
            case 'shop':
                return (
                    <GameStore 
                        user={user}
                        energySystem={energySystem}
                        onEnergyPurchase={handleEnergyPurchase}
                    />
                );
            default: // lobby
                return (
                    <GameLobby 
                        user={user} 
                        onJoinGame={handleJoinGame} 
                        onSignOut={() => authService.signOut()}
                        // Pass systems to existing GameLobby - it may not use them yet
                        energySystem={energySystem}
                        boardSystem={boardSystem}
                        playerProfile={playerProfile}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
            {/* Top Header */}
            <header className="bg-black/20 backdrop-blur-sm border-b border-white/20 p-4">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    {/* Game Title */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            MMO Party Quest
                        </h1>
                        {playerProfile && (
                            <div className="flex items-center gap-2 text-white">
                                <div className="bg-purple-600 rounded-lg px-3 py-1 text-sm font-semibold">
                                    Lv.{playerProfile.level}
                                </div>
                                <div className="text-yellow-400 font-semibold">
                                    {playerProfile.stats.totalCoinsEarned} coins
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Energy and User Info */}
                    <div className="flex items-center gap-4">
                        <EnergyStatusIndicator 
                            userId={user.uid}
                            onClick={() => setShowEnergyPanel(true)}
                        />
                        
                        <button
                            onClick={() => authService.signOut()}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex">
                {/* Side Navigation - Only show when not in game */}
                {activeTab !== 'game' && (
                    <nav className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/20 min-h-screen p-4">
                        <div className="space-y-2">
                            {navigationTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.name}
                                </button>
                            ))}
                        </div>

                        {/* Player Stats Summary */}
                        {playerProfile && (
                            <div className="mt-8 bg-white/10 rounded-lg p-4">
                                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Games Won:</span>
                                        <span className="text-white">{playerProfile.stats.gamesWon}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Win Rate:</span>
                                        <span className="text-white">{playerProfile.stats.winRate}%</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Stars:</span>
                                        <span className="text-yellow-400">{playerProfile.stats.starsCollected}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-300">
                                        <span>Achievements:</span>
                                        <span className="text-purple-400">
                                            {playerProfile.achievements}/{playerProfile.totalAchievements}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </nav>
                )}

                {/* Main Content */}
                <main className={`flex-1 ${activeTab === 'game' ? '' : 'p-6'}`}>
                    {renderMainContent()}
                </main>
            </div>

            {/* Energy Panel Modal */}
            {showEnergyPanel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white text-xl font-bold">Energy Management</h2>
                            <button
                                onClick={() => setShowEnergyPanel(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <EnergyDisplay 
                            userId={user.uid}
                            onEnergyPurchase={handleEnergyPurchase}
                            onWatchAd={handleWatchAd}
                        />
                    </div>
                </div>
            )}

            {/* Admin Panel */}
            {user && <AdminPanel user={user} />}

            {/* Floating Back to Game Button */}
            {currentGame && activeTab !== 'game' && (
                <button
                    onClick={() => setActiveTab('game')}
                    className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-colors z-40"
                >
                    <Gamepad2 className="w-5 h-5" />
                    Back to Game
                </button>
            )}
        </div>
    );
}

export default App;