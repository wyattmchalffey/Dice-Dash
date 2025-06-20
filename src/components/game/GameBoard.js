// src/components/game/GameBoard.js
// Enhanced GameBoard with energy system and progression integration

import React, { useState, useEffect } from 'react';
import { GameService } from '../../services/game-service';
import { Users, Clock, Star, Coins, Zap, ArrowLeft, Copy, Play, Battery, Trophy } from 'lucide-react';
import EnhancedGameBoard from './EnhancedGameBoard';
import { BoardManager, EnhancedBoardGenerator, BOARD_THEMES } from '../../systems/board-system';
import { ENHANCED_SPACE_TYPES } from '../../systems/enhanced-board-system';

const gameService = new GameService();

export function GameBoard({ 
  game: initialGame, 
  user, 
  onLeaveGame, 
  energySystem, 
  progressionSystem, 
  miniGameSystem, 
  boardSystem 
}) {
    const [game, setGame] = useState(initialGame);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    
    // Enhanced state for MMO Party Quest features
    const [currentEnergy, setCurrentEnergy] = useState(5);
    const [playerProfile, setPlayerProfile] = useState(null);
    const [diceValue, setDiceValue] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [lastSpaceEffect, setLastSpaceEffect] = useState(null);
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [pendingMiniGame, setPendingMiniGame] = useState(null);

    // Existing board state
    const [board, setBoard] = useState(null);
    const [boardManager, setBoardManager] = useState(null);

    // Initialize energy and progression tracking
    useEffect(() => {
        if (user && energySystem && progressionSystem) {
            // Update energy display
            setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
            
            // Load player profile
            const profile = progressionSystem.getPlayerProfile(user.uid);
            setPlayerProfile(profile);
            
            // Listen for energy updates
            const handleEnergyUpdate = () => {
                setCurrentEnergy(energySystem.getCurrentEnergy(user.uid));
            };
            
            window.addEventListener('energyUpdated', handleEnergyUpdate);
            return () => window.removeEventListener('energyUpdated', handleEnergyUpdate);
        }
    }, [user, energySystem, progressionSystem]);

    // Board generation effect (existing logic)
    useEffect(() => {
        if (game.status !== 'active' || board) {
            return;
        }

        console.log("Generating enhanced board for MMO Party Quest...");

        // Use enhanced board system if available
        if (boardSystem) {
            const boardInstance = boardSystem.createBoardInstance(
                game.theme || 'jungle_adventure', 
                game.id
            );
            
            // Add all players to the board
            game.players.forEach(player => {
                boardSystem.addPlayerToBoard(boardInstance.instanceId, {
                    id: player.userId,
                    name: player.name || player.displayName,
                    avatar: player.photoURL
                });
            });
            
            setBoard(boardInstance);
            setBoardManager(boardInstance); // Simplified for now
        } else {
            // Fallback to existing board generation
            const theme = BOARD_THEMES[game.boardTheme || 'JUNGLE_ADVENTURE'];
            const generator = new EnhancedBoardGenerator(theme);
            const generatedBoard = generator.generateMassiveBoard(10, 10, game.maxPlayers || 200);
            const manager = new BoardManager(generatedBoard);
            
            game.players.forEach((player, index) => {
                const spawnZone = generatedBoard.spawnZones[index % generatedBoard.spawnZones.length];
                const startSpace = generatedBoard.spaces.find(s =>
                    Math.abs(s.x - spawnZone.x) < 5 && Math.abs(s.y - spawnZone.y) < 5
                );
                if (startSpace) {
                    manager.updatePlayerPosition(player.userId, startSpace.id);
                }
            });

            setBoard(generatedBoard);
            setBoardManager(manager);
        }
    }, [game.status, game.id, boardSystem]);

    // Real-time game updates
    useEffect(() => {
        const unsubscribe = gameService.subscribeToGame(game.id, (updatedGame) => {
            if (updatedGame) {
                setGame(updatedGame);
            }
        });
        
        gameService.updatePlayerStatus(game.id, user.uid, true);

        return () => {
            unsubscribe();
            gameService.updatePlayerStatus(game.id, user.uid, false);
        };
    }, [game.id, user.uid]);

    // Enhanced dice rolling with energy consumption
    const handleDiceRoll = async () => {
        // Check energy before rolling
        if (!energySystem.canTakeAction(user.uid, 1)) {
            // Show energy warning
            window.dispatchEvent(new CustomEvent('showEnergyPanel'));
            return;
        }

        setIsRolling(true);
        setError('');
        
        try {
            // Consume energy for the action
            energySystem.spendEnergy(user.uid, 1);
            
            // Apply skill effects to dice roll
            let rollValue = Math.floor(Math.random() * 6) + 1;
            if (progressionSystem) {
                rollValue = progressionSystem.applySkillEffects(user.uid, 'dice_roll', rollValue);
            }
            
            setDiceValue(rollValue);
            
            // Award XP for taking a turn
            if (progressionSystem) {
                progressionSystem.awardActionXP(user.uid, 'space_visited');
            }
            
            // Move player
            setTimeout(() => {
                handlePlayerMove(rollValue);
            }, 1000);
            
        } catch (error) {
            setError('Failed to roll dice: ' + error.message);
        } finally {
            setTimeout(() => setIsRolling(false), 1000);
        }
    };

    // Enhanced player movement with space effects
    const handlePlayerMove = async (spaces) => {
        if (!boardManager && !boardSystem) return;
        
        try {
            let spaceEffect = null;
            
            if (boardSystem && board) {
                // Use enhanced board system
                const result = boardSystem.movePlayer(board.instanceId, user.uid, spaces);
                spaceEffect = result.newSpace;
                
                // Trigger space effect
                if (result.newSpace) {
                    const effect = boardSystem.triggerSpaceEffect(
                        board.instanceId, 
                        user.uid, 
                        result.newSpace
                    );
                    setLastSpaceEffect(effect);
                    
                    // Handle different space effects
                    if (effect.effect === 'trigger_minigame' && miniGameSystem) {
                        const randomGame = miniGameSystem.getAvailableGames()[
                            Math.floor(Math.random() * miniGameSystem.getAvailableGames().length)
                        ];
                        setPendingMiniGame(randomGame);
                        setShowMiniGame(true);
                    }
                }
            } else {
                // Fallback to existing logic
                const currentPlayer = game.players.find(p => p.userId === user.uid);
                const newPosition = (currentPlayer.position || 0) + spaces;
                
                // Update position in game service
                await gameService.updatePlayerPosition(game.id, user.uid, newPosition);
            }
            
            // Award progression for landing on spaces
            if (progressionSystem && spaceEffect) {
                progressionSystem.updateStats(user.uid, {
                    uniqueSpacesVisited: spaceEffect.type
                });
                
                // Award coins if gained
                if (spaceEffect.effect === 'gain_coins') {
                    progressionSystem.updateStats(user.uid, {
                        totalCoinsEarned: spaceEffect.value || 3
                    });
                }
                
                // Award star collection
                if (spaceEffect.effect === 'collect_star') {
                    progressionSystem.awardActionXP(user.uid, 'star_collected');
                    progressionSystem.updateStats(user.uid, {
                        starsCollected: 1
                    });
                }
            }
            
        } catch (error) {
            setError('Failed to move player: ' + error.message);
        }
    };

    // Handle mini-game completion
    const handleMiniGameComplete = (results) => {
        setShowMiniGame(false);
        setPendingMiniGame(null);
        
        if (results.won && progressionSystem) {
            progressionSystem.awardActionXP(user.uid, 'minigame_won');
        } else if (progressionSystem) {
            progressionSystem.awardActionXP(user.uid, 'minigame_participated');
        }
        
        // Apply mini-game score bonuses from skills
        if (progressionSystem && results.score) {
            const bonusScore = progressionSystem.applySkillEffects(
                user.uid, 
                'minigame_score', 
                results.score
            );
            console.log(`Mini-game completed! Score: ${bonusScore} (bonus applied)`);
        }
    };

    // Game control functions
    const isHost = game.hostId === user.uid;
    const canStartGame = isHost && game.status === 'waiting' && game.players.length >= 2;
    const currentPlayer = game.players.find(p => p.userId === user.uid);
    const canTakeAction = currentEnergy >= 1 && !isRolling;

    const startGame = async () => {
        setLoading(true);
        setError('');
        try {
            await gameService.startGame(game.id, user.uid);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyGameCode = async () => {
        try {
            await navigator.clipboard.writeText(game.gameCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    };

    // Waiting Room UI
    if (game.status === 'waiting') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <button 
                            onClick={onLeaveGame}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Lobby
                        </button>
                        
                        <div className="flex items-center gap-4">
                            {/* Energy Display */}
                            <div className="bg-white/10 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <Battery className="w-4 h-4 text-yellow-400" />
                                    <span className="text-white text-sm font-semibold">
                                        {currentEnergy}/5
                                    </span>
                                </div>
                            </div>
                            
                            {/* Player Level */}
                            {playerProfile && (
                                <div className="bg-purple-600 rounded-lg px-3 py-2">
                                    <span className="text-white text-sm font-semibold">
                                        Lv.{playerProfile.level}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    