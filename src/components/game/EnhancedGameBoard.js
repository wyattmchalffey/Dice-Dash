import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SPACE_TYPES } from '../../systems/board-system';

const EnhancedGameBoard = ({ game, board, boardManager, currentPlayer, onSpaceClick, onPlayerMove, onDiceRoll }) => {
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

    // Set initial view center based on current player position
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

    // Get space rendering properties
    const getSpaceStyle = useCallback((space) => {
        const spaceType = SPACE_TYPES[space.type.toUpperCase()];
        const baseColor = spaceType?.color || '#6b7280';

        let additionalClasses = '';
        if (space.isShortcut) additionalClasses += ' ring-2 ring-yellow-400';
        if (space.gravityWell) additionalClasses += ' animate-pulse';
        if (space.bubbleStream) additionalClasses += ' animate-bounce';

        return {
            backgroundColor: baseColor,
            boxShadow: `0 0 20px ${baseColor}88`,
            className: additionalClasses
        };
    }, []);

    // Render board on canvas for performance
    const renderBoard = useCallback(() => {
        if (!board || !canvasRef.current || !boardManager) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size if not set
        if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = canvas.offsetWidth || window.innerWidth;
            canvas.height = canvas.offsetHeight || window.innerHeight;
        }

        const cellSize = 40 * zoom;

        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply theme background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const theme = board.theme;
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Get visible spaces
        const visibleSpaces = boardManager.getViewportSpaces(
            viewCenter.x,
            viewCenter.y,
            Math.max(canvas.width, canvas.height) / cellSize / 2 + 5
        );

        console.log('Rendering board:', {
            boardSpaces: board.spaces.length,
            visibleSpaces: visibleSpaces.length,
            viewCenter,
            zoom,
            canvasSize: { width: canvas.width, height: canvas.height }
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

                    // Draw different line styles for shortcuts
                    if (space.isShortcut || connectedSpace.isShortcut) {
                        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
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
            const color = spaceType?.color || '#6b7280';

            // Draw space background
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Draw space border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 * zoom;
            ctx.stroke();

        // Draw special effects
        if (space.gravityWell) {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
            for (let i = 1; i <= space.pullStrength; i++) {
                ctx.beginPath();
                ctx.arc(x, y, cellSize * (0.4 + i * 0.2), 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        if (space.bubbleStream) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
            const targetSpace = board.spaces.find(s => s.id === space.connections[space.streamDirection]);
            if (targetSpace) {
                const tx = (targetSpace.x - viewCenter.x) * cellSize + canvas.width / 2;
                const ty = (targetSpace.y - viewCenter.y) * cellSize + canvas.height / 2;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(tx, ty);
                ctx.lineTo(tx + 10, ty - 10);
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - 10, ty - 10);
                ctx.stroke();
            }
        }

        // Draw space type icon
        ctx.font = `${16 * zoom}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const icons = {
            blue: '🔵',
            red: '🔴',
            star: '⭐',
            shop: '🛍️',
            event: '❓',
            minigame: '🎮',
            warp: '🌀'
        };

        if (icons[space.type]) {
            ctx.fillText(icons[space.type], x, y);
        }

        // Highlight valid moves
        if (validMoves.some(move => move.spaceId === space.id)) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4 * zoom;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Highlight selected space
        if (selectedSpace?.id === space.id) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4 * zoom;
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    // Draw players
    game.players.forEach(player => {
        const playerSpace = boardManager.playerPositions.get(player.id);
        const space = board.spaces.find(s => s.id === playerSpace);

        if (space && visibleSpaces.includes(space)) {
            const x = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
            const y = (space.y - viewCenter.y) * cellSize + canvas.height / 2;

            // Calculate offset for multiple players on same space
            const playersOnSpace = space.players || [];
            const playerIndex = playersOnSpace.indexOf(player.id);
            const angle = (playerIndex / playersOnSpace.length) * Math.PI * 2;
            const offsetX = Math.cos(angle) * cellSize * 0.2;
            const offsetY = Math.sin(angle) * cellSize * 0.2;

            // Draw player token
            ctx.fillStyle = player.color || '#ffffff';
            ctx.strokeStyle = player.id === currentPlayer?.id ? '#fbbf24' : '#000000';
            ctx.lineWidth = 3 * zoom;

            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, cellSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw player name
            ctx.fillStyle = '#ffffff';
            ctx.font = `${12 * zoom}px Arial`;
            ctx.fillText(player.name, x + offsetX, y + offsetY + cellSize * 0.4);
        }
    });

    // Draw special effects
    Object.entries(spaceEffects).forEach(([spaceId, effect]) => {
        const space = board.spaces.find(s => s.id === parseInt(spaceId));
        if (space && visibleSpaces.includes(space)) {
            const x = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
            const y = (space.y - viewCenter.y) * cellSize + canvas.height / 2;

            ctx.save();
            ctx.globalAlpha = effect.opacity || 0.5;
            ctx.fillStyle = effect.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, cellSize * effect.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });
}, [board, boardManager, viewCenter, zoom, validMoves, selectedSpace, game.players, currentPlayer, spaceEffects]);

// Render minimap
const renderMinimap = useCallback(() => {
    if (!board || !minimapRef.current) return;

    const canvas = minimapRef.current;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / board.width;

    // Clear minimap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all spaces as dots
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

    // Draw viewport rectangle
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        (viewCenter.x - 10) * scale,
        (viewCenter.y - 10) * scale,
        20 * scale,
        20 * scale
    );

    // Draw player positions
    game.players.forEach(player => {
        const playerSpace = boardManager.playerPositions.get(player.id);
        const space = board.spaces.find(s => s.id === playerSpace);

        if (space) {
            ctx.fillStyle = player.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(space.x * scale, space.y * scale, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}, [board, boardManager, viewCenter, game.players]);

// Animation loop
useEffect(() => {
    const animate = () => {
        renderBoard();
        if (showMinimap) {
            renderMinimap();
        }
        animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };
}, [renderBoard, renderMinimap, showMinimap]);

// Handle window resize
useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = canvasRef.current.offsetWidth;
            canvasRef.current.height = canvasRef.current.offsetHeight;
        }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);

// Handle canvas click
const handleCanvasClick = (e) => {
    if (!board || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = 40 * zoom;
    const worldX = (x - canvas.width / 2) / cellSize + viewCenter.x;
    const worldY = (y - canvas.height / 2) / cellSize + viewCenter.y;

    // Find clicked space
    const clickedSpace = board.spaces.find(space => {
        const distance = Math.sqrt(
            Math.pow(space.x - worldX, 2) +
            Math.pow(space.y - worldY, 2)
        );
        return distance < 0.5;
    });

    if (clickedSpace) {
        setSelectedSpace(clickedSpace);

        // If it's a valid move, execute it
        const validMove = validMoves.find(move => move.spaceId === clickedSpace.id);
        if (validMove && onPlayerMove) {
            animatePlayerMove(validMove.path);
        } else if (onSpaceClick) {
            onSpaceClick(clickedSpace);
        }
    }
};

// Animate player movement along path
const animatePlayerMove = async (path) => {
    setAnimatingMove(true);
    setValidMoves([]);

    for (let i = 1; i < path.length; i++) {
        const space = board.spaces.find(s => s.id === path[i]);
        if (space) {
            // Center view on moving player
            setViewCenter({
                x: space.x,
                y: space.y
            });

            // Add movement effect
            setSpaceEffects(prev => ({
                ...prev,
                [space.id]: {
                    color: '#10b981',
                    radius: 0.6,
                    opacity: 0.3
                }
            }));

            await new Promise(resolve => setTimeout(resolve, 300));

            // Remove effect
            setSpaceEffects(prev => {
                const next = { ...prev };
                delete next[space.id];
                return next;
            });
        }
    }

    setAnimatingMove(false);

    // Trigger space landing
    if (onPlayerMove) {
        const finalSpace = path[path.length - 1];
        onPlayerMove(finalSpace);
    }
};

// Handle dice roll
const handleDiceRoll = (roll) => {
    if (!currentPlayer || animatingMove) return;

    const moves = boardManager.getValidMoves(currentPlayer.id, roll);
    setValidMoves(moves);
};

// Keyboard controls
useEffect(() => {
    const handleKeyPress = (e) => {
        const moveSpeed = 5;
        switch (e.key) {
            case 'ArrowUp':
                setViewCenter(prev => ({ ...prev, y: Math.max(0, prev.y - moveSpeed) }));
                break;
            case 'ArrowDown':
                setViewCenter(prev => ({ ...prev, y: Math.min(board.height - 1, prev.y + moveSpeed) }));
                break;
            case 'ArrowLeft':
                setViewCenter(prev => ({ ...prev, x: Math.max(0, prev.x - moveSpeed) }));
                break;
            case 'ArrowRight':
                setViewCenter(prev => ({ ...prev, x: Math.min(board.width - 1, prev.x + moveSpeed) }));
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
}, [board]);

if (!board) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Generating massive board...</div>
        </div>
    );
}

return (
    <div className="relative w-full h-full bg-slate-900">
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
                    width={200}
                    height={200}
                    className="cursor-pointer"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const scale = 200 / board.width;
                        setViewCenter({
                            x: x / scale,
                            y: y / scale
                        });
                    }}
                />
            </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-4 bg-slate-800 p-4 rounded-lg shadow-xl">
            <div className="text-white space-y-2">
                <div>Use arrow keys to move view</div>
                <div>+/- to zoom</div>
                <div>M to toggle minimap</div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => handleDiceRoll(Math.floor(Math.random() * 6) + 1)}
                        disabled={animatingMove || !currentPlayer}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Roll Dice
                    </button>
                    <button
                        onClick={() => {
                            const playerSpace = boardManager.playerPositions.get(currentPlayer?.id);
                            const space = board.spaces.find(s => s.id === playerSpace);
                            if (space) {
                                setViewCenter({ x: space.x, y: space.y });
                            }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Center on Me
                    </button>
                </div>
            </div>
        </div>

        {/* Space info panel */}
        {selectedSpace && (
            <div className="absolute top-4 left-4 bg-slate-800 p-4 rounded-lg shadow-xl max-w-sm">
                <h3 className="text-white font-bold text-lg">{selectedSpace.name}</h3>
                <p className="text-gray-300">Position: ({selectedSpace.x}, {selectedSpace.y})</p>
                <p className="text-gray-300">Type: {selectedSpace.type}</p>
                {SPACE_TYPES[selectedSpace.type.toUpperCase()] && (
                    <p className="text-gray-400 mt-2">
                        Effect: {SPACE_TYPES[selectedSpace.type.toUpperCase()].effect}
                    </p>
                )}
                {selectedSpace.players && selectedSpace.players.length > 0 && (
                    <div className="mt-2">
                        <p className="text-gray-300">Players here:</p>
                        <ul className="text-gray-400">
                            {selectedSpace.players.map(playerId => {
                                const player = game.players.find(p => p.id === playerId);
                                return player ? <li key={playerId}>{player.name}</li> : null;
                            })}
                        </ul>
                    </div>
                )}
                {selectedSpace.isShortcut && (
                    <p className="text-yellow-400 mt-2">⚡ Shortcut Path</p>
                )}
                {selectedSpace.warpPartner && (
                    <p className="text-cyan-400 mt-2">🌀 Warps to Space {selectedSpace.warpPartner}</p>
                )}
            </div>
        )}
    </div>
);
};

export default EnhancedGameBoard;