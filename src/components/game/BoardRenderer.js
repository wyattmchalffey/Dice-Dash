// src/components/game/BoardRenderer.js
// Optimized renderer for standard-sized Mario Party-style boards

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SPACE_TYPES } from '../../systems/board-system';

const BoardRenderer = ({ 
    board, 
    boardManager, 
    currentPlayer, 
    game,
    onSpaceClick, 
    onPlayerMove, 
    validMoves = [],
    selectedSpace = null 
}) => {
    const [viewCenter, setViewCenter] = useState({ x: 40, y: 30 });
    const [zoom, setZoom] = useState(1.2);
    const [showMinimap, setShowMinimap] = useState(true);
    const [animatingPlayers, setAnimatingPlayers] = useState(new Set());
    const [spaceAnimations, setSpaceAnimations] = useState({});
    const [hoveredSpace, setHoveredSpace] = useState(null);

    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const animationRef = useRef(null);
    const lastUpdateTime = useRef(0);

    // Standard board styling constants (optimized for 80x60 boards)
    const SPACE_SIZE = 32;
    const SPACE_BORDER_WIDTH = 3;
    const PLAYER_SIZE = 20;
    const MINIMAP_SIZE = 150;
    const ANIMATION_SPEED = 0.08;
    const BOARD_PADDING = 10;

    // Player colors for up to 8 players
    const PLAYER_COLORS = [
        '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    // Initialize view center 
    useEffect(() => {
        if (board) {
            setViewCenter({ x: board.width / 2, y: board.height / 2 });
        }
    }, [board]);

    // Focus view on current player
    useEffect(() => {
        if (currentPlayer && boardManager && board) {
            const playerPosition = boardManager.getPlayerPosition(currentPlayer.userId);
            if (playerPosition !== undefined) {
                const space = board.spaces.find(s => s.id === playerPosition);
                if (space) {
                    setViewCenter({ x: space.x, y: space.y });
                }
            }
        }
    }, [currentPlayer, boardManager, board]);

    // Handle keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            const moveSpeed = 5;
            switch (e.key) {
                case 'ArrowUp':
                    setViewCenter(prev => ({ ...prev, y: Math.max(0, prev.y - moveSpeed) }));
                    break;
                case 'ArrowDown':
                    setViewCenter(prev => ({ ...prev, y: Math.min(board?.height || 60, prev.y + moveSpeed) }));
                    break;
                case 'ArrowLeft':
                    setViewCenter(prev => ({ ...prev, x: Math.max(0, prev.x - moveSpeed) }));
                    break;
                case 'ArrowRight':
                    setViewCenter(prev => ({ ...prev, x: Math.min(board?.width || 80, prev.x + moveSpeed) }));
                    break;
                case 'M':
                case 'm':
                    setShowMinimap(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [board]);

    // Handle mouse wheel zoom
    const handleWheel = (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.5, Math.min(2.0, prev + zoomDelta)));
    };

    // Handle canvas click
    const handleCanvasClick = (e) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert screen coordinates to board coordinates
        const spaceSize = SPACE_SIZE * zoom;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const boardX = viewCenter.x + (clickX - canvasWidth / 2) / spaceSize;
        const boardY = viewCenter.y + (clickY - canvasHeight / 2) / spaceSize;

        // Find clicked space
        const clickedSpace = board.spaces.find(space => {
            const dx = Math.abs(space.x - boardX);
            const dy = Math.abs(space.y - boardY);
            return dx < 1.5 && dy < 1.5;
        });

        if (clickedSpace && onSpaceClick) {
            onSpaceClick(clickedSpace);
        }
    };

    // Main animation loop
    useEffect(() => {
        const animate = (currentTime) => {
            const deltaTime = currentTime - lastUpdateTime.current;
            lastUpdateTime.current = currentTime;

            renderBoard(deltaTime);
            if (showMinimap) renderMinimap();
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [board, boardManager, viewCenter, zoom, validMoves, selectedSpace, game, currentPlayer, showMinimap]);

    // Main board rendering function
    const renderBoard = useCallback((deltaTime) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to match container
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const spaceSize = SPACE_SIZE * zoom;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Clear canvas with theme background
        drawThemeBackground(ctx, canvasWidth, canvasHeight);

        // Calculate what's visible (optimized for smaller boards)
        const visibleSpaces = board.spaces.filter(space => {
            const screenX = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
            const screenY = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
            return screenX > -spaceSize && screenX < canvasWidth + spaceSize &&
                   screenY > -spaceSize && screenY < canvasHeight + spaceSize;
        });

        // Draw path connections
        drawSpaceConnections(ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight);

        // Draw landmarks
        if (board.landmarks) {
            drawLandmarks(ctx, board.landmarks, spaceSize, canvasWidth, canvasHeight);
        }

        // Draw spaces
        visibleSpaces.forEach(space => {
            drawSpace(ctx, space, spaceSize, canvasWidth, canvasHeight, deltaTime);
        });

        // Draw players
        drawPlayers(ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight);

        // Draw UI overlays
        drawUIOverlays(ctx, canvasWidth, canvasHeight);

    }, [board, boardManager, viewCenter, zoom, validMoves, selectedSpace, game, currentPlayer, spaceAnimations, hoveredSpace]);

    // Draw theme background
    const drawThemeBackground = (ctx, width, height) => {
        if (!board?.theme) return;

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, board.theme.backgroundColor);
        gradient.addColorStop(1, adjustBrightness(board.theme.backgroundColor, -15));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    };

    // Draw connections between spaces
    const drawSpaceConnections = (ctx, spaces, spaceSize, canvasWidth, canvasHeight) => {
        ctx.save();
        ctx.strokeStyle = board.theme?.pathColor || '#fbbf24';
        ctx.lineWidth = 6 * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw main path
        const mainSpaces = spaces.filter(s => s.pathType === 'main').sort((a, b) => a.pathIndex - b.pathIndex);
        
        if (mainSpaces.length > 1) {
            ctx.beginPath();
            
            for (let i = 0; i < mainSpaces.length; i++) {
                const space = mainSpaces[i];
                const nextSpace = mainSpaces[(i + 1) % mainSpaces.length];
                
                const x1 = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
                const y1 = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
                const x2 = (nextSpace.x - viewCenter.x) * spaceSize + canvasWidth / 2;
                const y2 = (nextSpace.y - viewCenter.y) * spaceSize + canvasHeight / 2;
                
                if (i === 0) {
                    ctx.moveTo(x1, y1);
                }
                ctx.lineTo(x2, y2);
            }
            
            ctx.stroke();
        }

        // Draw branch connections
        const branchSpaces = spaces.filter(s => s.pathType === 'branch');
        const branches = groupBy(branchSpaces, 'branchId');
        
        Object.values(branches).forEach(branch => {
            branch.sort((a, b) => a.pathIndex - b.pathIndex);
            
            ctx.beginPath();
            branch.forEach((space, index) => {
                const x = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
                const y = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        });

        ctx.restore();
    };

    // Draw individual space
    const drawSpace = (ctx, space, spaceSize, canvasWidth, canvasHeight, deltaTime) => {
        const x = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
        const y = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
        
        // Skip if completely off-screen
        if (x < -spaceSize || x > canvasWidth + spaceSize || 
            y < -spaceSize || y > canvasHeight + spaceSize) return;

        ctx.save();

        const spaceType = SPACE_TYPES[space.type] || SPACE_TYPES.BLUE;
        const size = spaceSize * 0.7;
        
        // Highlight if valid move
        const isValidMove = validMoves.includes(space.id);
        const isSelected = selectedSpace === space.id;
        
        if (isValidMove || isSelected) {
            ctx.strokeStyle = isSelected ? '#ffffff' : '#ffff00';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x - size/2 - 2, y - size/2 - 2, size + 4, size + 4);
            ctx.setLineDash([]);
        }

        // Draw space background
        ctx.fillStyle = spaceType.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = SPACE_BORDER_WIDTH;
        
        ctx.fillRect(x - size/2, y - size/2, size, size);
        ctx.strokeRect(x - size/2, y - size/2, size, size);

        // Draw space icon
        ctx.fillStyle = spaceType.textColor;
        ctx.font = `${Math.max(12, size * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spaceType.icon, x, y);

        // Draw space number for debugging
        if (zoom > 1.0) {
            ctx.fillStyle = '#000000';
            ctx.font = `${Math.max(8, size * 0.2)}px Arial`;
            ctx.fillText(space.id, x, y + size/2 + 10);
        }

        ctx.restore();
    };

    // Draw players on spaces
    const drawPlayers = (ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight) => {
        if (!boardManager || !game || !game.players) return;

        // Ensure game.players is an array
        const playersArray = Array.isArray(game.players) ? game.players : [];

        // Group players by space
        const playersOnSpaces = new Map();

        playersArray.forEach(player => {
            const position = boardManager.getPlayerPosition(player.userId);
            if (position !== undefined) {
                if (!playersOnSpaces.has(position)) {
                    playersOnSpaces.set(position, []);
                }
                playersOnSpaces.get(position).push(player);
            }
        });

        // Draw players
        playersOnSpaces.forEach((players, spaceId) => {
            const space = visibleSpaces.find(s => s.id === spaceId);
            if (!space) return;

            const spaceX = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
            const spaceY = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;

            players.forEach((player, index) => {
                // Find player index safely
                const playerIndex = playersArray.findIndex(p => p.userId === player.userId);
                const color = PLAYER_COLORS[playerIndex >= 0 ? playerIndex % PLAYER_COLORS.length : 0];

                // Arrange multiple players around the space
                const angle = (index / players.length) * 2 * Math.PI;
                const radius = players.length > 1 ? spaceSize * 0.3 : 0;
                const x = spaceX + Math.cos(angle) * radius;
                const y = spaceY + Math.sin(angle) * radius;

                // Draw player
                ctx.save();
                ctx.fillStyle = color;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.arc(x, y, PLAYER_SIZE * zoom * 0.4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // Draw player name if zoomed in
                if (zoom > 0.8) {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 3;
                    ctx.font = `${Math.max(10, PLAYER_SIZE * zoom * 0.5)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';

                    const name = player.name || player.displayName || `Player ${playerIndex + 1}`;
                    const shortName = name.length > 8 ? name.substring(0, 8) + '...' : name;

                    ctx.strokeText(shortName, x, y + PLAYER_SIZE * zoom * 0.5);
                    ctx.fillText(shortName, x, y + PLAYER_SIZE * zoom * 0.5);
                }

                ctx.restore();
            });
        });
    };

    // Draw landmarks
    const drawLandmarks = (ctx, landmarks, spaceSize, canvasWidth, canvasHeight) => {
        landmarks.forEach(landmark => {
            const x = (landmark.x - viewCenter.x) * spaceSize + canvasWidth / 2;
            const y = (landmark.y - viewCenter.y) * spaceSize + canvasHeight / 2;
            
            // Skip if off-screen
            if (x < -100 || x > canvasWidth + 100 || y < -100 || y > canvasHeight + 100) return;

            ctx.save();
            
            const size = landmark.size === 'large' ? spaceSize * 2 : spaceSize * 1.5;
            
            // Draw landmark shape
            ctx.fillStyle = board.theme?.decorativeColor || '#16a34a';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.arc(x, y, size * 0.4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Draw landmark name
            if (zoom > 0.7) {
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.font = `${Math.max(12, size * 0.3)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                
                ctx.strokeText(landmark.name, x, y + size * 0.5);
                ctx.fillText(landmark.name, x, y + size * 0.5);
            }
            
            ctx.restore();
        });
    };

    // Draw UI overlays
    const drawUIOverlays = (ctx, canvasWidth, canvasHeight) => {
        // Draw controls info
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, canvasHeight - 100, 200, 90);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        const instructions = [
            'Arrow Keys: Pan view',
            'Mouse Wheel: Zoom',
            'Click: Select space',
            `M: Toggle minimap ${showMinimap ? '(ON)' : '(OFF)'}`,
            `Zoom: ${Math.round(zoom * 100)}%`
        ];
        
        instructions.forEach((text, index) => {
            ctx.fillText(text, 15, canvasHeight - 80 + (index * 15));
        });
        
        ctx.restore();
    };

    // Render minimap
    const renderMinimap = useCallback(() => {
        if (!board || !minimapRef.current) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');
        const scale = MINIMAP_SIZE / Math.max(board.width, board.height);

        // Clear minimap
        ctx.fillStyle = 'rgba(20, 25, 35, 0.95)';
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Draw border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Draw spaces
        board.spaces.forEach(space => {
            const spaceType = SPACE_TYPES[space.type];
            ctx.fillStyle = spaceType?.color || '#6b7280';
            
            const x = space.x * scale;
            const y = space.y * scale;
            const size = 3;
            
            ctx.fillRect(x - size/2, y - size/2, size, size);
        });

        // Draw view area
        const viewSize = 20 * scale;
        const viewX = viewCenter.x * scale - viewSize/2;
        const viewY = viewCenter.y * scale - viewSize/2;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(viewX, viewY, viewSize, viewSize);

    }, [board, viewCenter]);

    // Utility functions
    const adjustBrightness = (color, percent) => {
        // Simple brightness adjustment
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const groupBy = (array, key) => {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    };

    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onClick={handleCanvasClick}
                onWheel={handleWheel}
                style={{ background: '#1e293b' }}
            />
            
            {showMinimap && (
                <canvas
                    ref={minimapRef}
                    width={MINIMAP_SIZE}
                    height={MINIMAP_SIZE}
                    className="absolute top-4 right-4 border border-gray-600 rounded"
                />
            )}
        </div>
    );
};

export default BoardRenderer;