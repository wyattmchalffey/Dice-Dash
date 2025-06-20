// src/components/game/EnhancedGameBoard.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SPACE_TYPES } from '../../systems/board-system';

const EnhancedGameBoard = ({ 
    game, 
    board, 
    boardManager, 
    currentPlayer, 
    onSpaceClick, 
    onPlayerMove, 
    onDiceRoll 
}) => {
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [viewCenter, setViewCenter] = useState({ x: 50, y: 50 });
    const [zoom, setZoom] = useState(1);
    const [showMinimap, setShowMinimap] = useState(true);
    const [animatingMove, setAnimatingMove] = useState(false);
    const [spaceEffects, setSpaceEffects] = useState({});

    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const animationRef = useRef(null);

    // Constants
    const CELL_SIZE = 40;
    const MINIMAP_SIZE = 200;
    const MOVE_SPEED = 5;

    // Initialize view center based on current player position
    useEffect(() => {
        if (currentPlayer && boardManager && board) {
            const playerPosition = boardManager.playerPositions.get(currentPlayer.userId);
            if (playerPosition !== undefined) {
                const space = board.spaces.find(s => s.id === playerPosition);
                if (space) {
                    setViewCenter({ x: space.x, y: space.y });
                }
            }
        }
    }, [currentPlayer, boardManager, board]);

    // Main render loop
    useEffect(() => {
        const animate = () => {
            renderBoard();
            renderMinimap();
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [board, boardManager, viewCenter, zoom, validMoves, selectedSpace, game, currentPlayer, spaceEffects]);

    // Render the main game board
    const renderBoard = useCallback(() => {
        if (!board || !canvasRef.current || !boardManager) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to match container
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const cellSize = CELL_SIZE * zoom;

        // Clear and draw background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate visible area
        const viewRadius = Math.max(canvas.width, canvas.height) / cellSize / 2 + 5;
        const visibleSpaces = board.spaces.filter(space => {
            const dx = Math.abs(space.x - viewCenter.x);
            const dy = Math.abs(space.y - viewCenter.y);
            return dx <= viewRadius && dy <= viewRadius;
        });

        // Draw connections
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.lineWidth = 2 * zoom;

        visibleSpaces.forEach(space => {
            const x1 = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
            const y1 = (space.y - viewCenter.y) * cellSize + canvas.height / 2;

            space.connections.forEach(connectionId => {
                const connectedSpace = board.spaces.find(s => s.id === connectionId);
                if (connectedSpace && visibleSpaces.includes(connectedSpace)) {
                    const x2 = (connectedSpace.x - viewCenter.x) * cellSize + canvas.width / 2;
                    const y2 = (connectedSpace.y - viewCenter.y) * cellSize + canvas.height / 2;

                    // Special style for shortcuts
                    if (space.isShortcut || connectedSpace.isShortcut) {
                        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                        ctx.setLineDash([5, 5]);
                    } else {
                        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
                        ctx.setLineDash([]);
                    }

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            });
        });

        // Draw spaces
        visibleSpaces.forEach(space => {
            const x = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
            const y = (space.y - viewCenter.y) * cellSize + canvas.height / 2;
            
            const spaceType = SPACE_TYPES[space.type.toUpperCase()];
            const baseColor = spaceType?.color || '#6b7280';

            // Draw space circle
            ctx.fillStyle = baseColor;
            ctx.strokeStyle = validMoves.includes(space.id) ? '#fbbf24' : '#ffffff33';
            ctx.lineWidth = validMoves.includes(space.id) ? 3 * zoom : 1 * zoom;

            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw special indicators
            if (space.isShortcut) {
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2 * zoom;
                ctx.beginPath();
                ctx.arc(x, y, cellSize * 0.45, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw space number
            ctx.fillStyle = '#ffffff';
            ctx.font = `${12 * zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(space.id.toString(), x, y);
        });

        // Draw players
        if (game && game.players) {
            game.players.forEach(player => {
                const position = boardManager.playerPositions.get(player.userId);
                if (position !== undefined) {
                    const space = board.spaces.find(s => s.id === position);
                    if (space && visibleSpaces.includes(space)) {
                        const x = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
                        const y = (space.y - viewCenter.y) * cellSize + canvas.height / 2;

                        // Player circle
                        ctx.fillStyle = player.color || '#4ade80';
                        ctx.strokeStyle = player.userId === currentPlayer?.userId ? '#fbbf24' : '#000000';
                        ctx.lineWidth = 3 * zoom;

                        ctx.beginPath();
                        ctx.arc(x, y - cellSize * 0.2, cellSize * 0.25, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();

                        // Player name
                        ctx.fillStyle = '#ffffff';
                        ctx.font = `${10 * zoom}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.fillText(player.name, x, y + cellSize * 0.5);
                    }
                }
            });
        }
    }, [board, boardManager, viewCenter, zoom, validMoves, game, currentPlayer]);

    // Render minimap
    const renderMinimap = useCallback(() => {
        if (!board || !minimapRef.current || !showMinimap) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');
        const scale = MINIMAP_SIZE / board.width;

        // Clear minimap
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Draw all spaces
        board.spaces.forEach(space => {
            const spaceType = SPACE_TYPES[space.type.toUpperCase()];
            ctx.fillStyle = spaceType?.color || '#6b7280';
            ctx.fillRect(
                space.x * scale - 1,
                space.y * scale - 1,
                2,
                2
            );
        });

        // Draw viewport
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        const viewSize = 20;
        ctx.strokeRect(
            (viewCenter.x - viewSize/2) * scale,
            (viewCenter.y - viewSize/2) * scale,
            viewSize * scale,
            viewSize * scale
        );

        // Draw players
        if (game && game.players) {
            game.players.forEach(player => {
                const position = boardManager.playerPositions.get(player.userId);
                if (position !== undefined) {
                    const space = board.spaces.find(s => s.id === position);
                    if (space) {
                        ctx.fillStyle = player.color || '#4ade80';
                        ctx.beginPath();
                        ctx.arc(space.x * scale, space.y * scale, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        }
    }, [board, boardManager, viewCenter, showMinimap, game]);

    // Handle canvas click
    const handleCanvasClick = (e) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cellSize = CELL_SIZE * zoom;
        const worldX = (x - canvas.width / 2) / cellSize + viewCenter.x;
        const worldY = (y - canvas.height / 2) / cellSize + viewCenter.y;

        // Find clicked space
        const clickedSpace = board.spaces.find(space => {
            const dx = Math.abs(space.x - worldX);
            const dy = Math.abs(space.y - worldY);
            return Math.sqrt(dx * dx + dy * dy) < 0.4;
        });

        if (clickedSpace) {
            setSelectedSpace(clickedSpace);
            if (onSpaceClick) {
                onSpaceClick(clickedSpace);
            }
        }
    };

    // Handle minimap click
    const handleMinimapClick = (e) => {
        if (!minimapRef.current || !board) return;

        const rect = minimapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scale = MINIMAP_SIZE / board.width;

        setViewCenter({
            x: x / scale,
            y: y / scale
        });
    };

    // Handle keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    setViewCenter(prev => ({ ...prev, y: prev.y - MOVE_SPEED }));
                    break;
                case 'ArrowDown':
                    setViewCenter(prev => ({ ...prev, y: prev.y + MOVE_SPEED }));
                    break;
                case 'ArrowLeft':
                    setViewCenter(prev => ({ ...prev, x: prev.x - MOVE_SPEED }));
                    break;
                case 'ArrowRight':
                    setViewCenter(prev => ({ ...prev, x: prev.x + MOVE_SPEED }));
                    break;
                case '+':
                case '=':
                    setZoom(prev => Math.min(2, prev + 0.1));
                    break;
                case '-':
                    setZoom(prev => Math.max(0.5, prev - 0.1));
                    break;
                case 'm':
                    setShowMinimap(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Loading state
    if (!board) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900">
                <div className="text-white text-xl">Generating massive board...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden">
            {/* Main game canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-pointer"
                onClick={handleCanvasClick}
            />

            {/* Minimap */}
            {showMinimap && (
                <div className="absolute top-4 right-4 bg-slate-800 p-2 rounded-lg shadow-xl">
                    <canvas
                        ref={minimapRef}
                        width={MINIMAP_SIZE}
                        height={MINIMAP_SIZE}
                        className="cursor-pointer"
                        onClick={handleMinimapClick}
                    />
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-4 bg-slate-800 p-4 rounded-lg shadow-xl">
                <div className="text-white space-y-2 text-sm">
                    <div>Use arrow keys to move view</div>
                    <div>+/- to zoom</div>
                    <div>M to toggle minimap</div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setZoom(1)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Reset Zoom
                        </button>
                        <button
                            onClick={() => {
                                if (currentPlayer && boardManager) {
                                    const position = boardManager.playerPositions.get(currentPlayer.userId);
                                    const space = board.spaces.find(s => s.id === position);
                                    if (space) {
                                        setViewCenter({ x: space.x, y: space.y });
                                    }
                                }
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Center on Me
                        </button>
                    </div>
                </div>
            </div>

            {/* Player info */}
            {currentPlayer && (
                <div className="absolute top-4 left-4 bg-slate-800 p-4 rounded-lg shadow-xl">
                    <div className="text-white">
                        <div className="font-bold">{currentPlayer.name}</div>
                        <div className="text-sm text-gray-400">Position: {boardManager?.playerPositions.get(currentPlayer.userId) || 0}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedGameBoard;