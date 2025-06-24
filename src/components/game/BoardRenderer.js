// src/components/game/BoardRenderer.js
// Enhanced renderer with beautiful visuals and animations

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
    const [zoom, setZoom] = useState(1.5);
    const [showMinimap, setShowMinimap] = useState(true);
    const [animatingPlayers, setAnimatingPlayers] = useState(new Set());
    const [spaceAnimations, setSpaceAnimations] = useState({});
    const [hoveredSpace, setHoveredSpace] = useState(null);
    const [particles, setParticles] = useState([]);

    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const animationRef = useRef(null);
    const lastUpdateTime = useRef(0);
    const mousePos = useRef({ x: 0, y: 0 });

    // Enhanced visual constants
    const SPACE_SIZE = 40;
    const SPACE_BORDER_WIDTH = 3;
    const PLAYER_SIZE = 24;
    const MINIMAP_SIZE = 180;
    const ANIMATION_SPEED = 0.08;
    const BOARD_PADDING = 20;

    // Enhanced color palette
    const PLAYER_COLORS = [
        { primary: '#ef4444', secondary: '#dc2626', glow: '#fca5a5' },
        { primary: '#3b82f6', secondary: '#2563eb', glow: '#93bbfc' },
        { primary: '#10b981', secondary: '#059669', glow: '#6ee7b7' },
        { primary: '#f59e0b', secondary: '#d97706', glow: '#fcd34d' },
        { primary: '#8b5cf6', secondary: '#7c3aed', glow: '#c4b5fd' },
        { primary: '#ec4899', secondary: '#db2777', glow: '#f9a8d4' },
        { primary: '#06b6d4', secondary: '#0891b2', glow: '#67e8f9' },
        { primary: '#84cc16', secondary: '#65a30d', glow: '#bef264' }
    ];

    // Particle system for visual effects
    class Particle {
        constructor(x, y, type = 'star') {
            this.x = x;
            this.y = y;
            this.type = type;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2 - 1;
            this.life = 1.0;
            this.decay = 0.02;
            this.size = Math.random() * 3 + 2;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            this.rotation += this.rotationSpeed;
            this.vy += 0.05; // gravity
        }

        draw(ctx) {
            if (this.life <= 0) return;

            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.type === 'star') {
                ctx.fillStyle = '#fbbf24';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fbbf24';
                this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
            } else if (this.type === 'coin') {
                ctx.fillStyle = '#fde047';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#fde047';
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(x, y - outerRadius);

            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
                rot += step;
                ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
                rot += step;
            }

            ctx.lineTo(x, y - outerRadius);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Enhanced theme background with animated gradient
    const drawThemeBackground = useCallback((ctx, width, height, deltaTime) => {
        const time = Date.now() * 0.0001;
        
        // Create animated gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        const hue1 = (time * 10) % 360;
        const hue2 = (hue1 + 60) % 360;
        
        if (board?.theme?.id === 'classic_plains') {
            gradient.addColorStop(0, '#1e3a5f'); // Deep blue sky
            gradient.addColorStop(0.5, '#2d5a8e');
            gradient.addColorStop(1, '#1e3a5f');
        } else if (board?.theme?.id === 'crystal_cave') {
            gradient.addColorStop(0, '#0f172a'); // Dark cave
            gradient.addColorStop(0.5, '#1e293b');
            gradient.addColorStop(1, '#0f172a');
        } else {
            gradient.addColorStop(0, '#0c4a6e'); // Ocean blue
            gradient.addColorStop(0.5, '#0284c7');
            gradient.addColorStop(1, '#0c4a6e');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add subtle pattern overlay
        ctx.globalAlpha = 0.05;
        for (let x = 0; x < width; x += 100) {
            for (let y = 0; y < height; y += 100) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + Math.sin(time + x * 0.01) * 10, y + Math.cos(time + y * 0.01) * 10, 2, 2);
            }
        }
        ctx.globalAlpha = 1.0;
    }, [board?.theme?.id]);

    // Enhanced space rendering with glow effects
    const drawSpace = useCallback((ctx, space, spaceSize, canvasWidth, canvasHeight, deltaTime) => {
        const spaceType = SPACE_TYPES[space.type] || SPACE_TYPES.BLUE;
        const x = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
        const y = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
        const size = spaceSize * 0.8;
        const time = Date.now() * 0.001;

        ctx.save();

        // Draw outer glow
        if (validMoves.includes(space.id)) {
            const pulseSize = size + Math.sin(time * 3) * 5;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - pulseSize, y - pulseSize, pulseSize * 2, pulseSize * 2);
        }

        // Draw space shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Draw space with rounded corners
        const radius = size * 0.15;
        ctx.fillStyle = spaceType.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = SPACE_BORDER_WIDTH;
        
        roundRect(ctx, x - size/2, y - size/2, size, size, radius);
        ctx.fill();
        
        // Reset shadow for border
        ctx.shadowColor = 'transparent';
        ctx.stroke();

        // Draw inner highlight
        ctx.save();
        ctx.globalAlpha = 0.3;
        const highlightGradient = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
        highlightGradient.addColorStop(0, '#ffffff');
        highlightGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = highlightGradient;
        roundRect(ctx, x - size/2 + 2, y - size/2 + 2, size - 4, size/2, radius);
        ctx.fill();
        ctx.restore();

        // Draw space icon with glow
        if (space.type === 'STAR' || space.type === 'SHOP') {
            ctx.shadowColor = spaceType.color;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = spaceType.textColor;
        ctx.font = `bold ${Math.max(16, size * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spaceType.icon, x, y);

        // Draw space number with better visibility
        if (zoom > 1.2) {
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(10, size * 0.2)}px Arial`;
            ctx.fillText(space.id, x, y + size/2 + 12);
        }

        // Add hover effect
        if (hoveredSpace === space.id) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.5;
            roundRect(ctx, x - size/2 - 4, y - size/2 - 4, size + 8, size + 8, radius);
            ctx.stroke();
        }

        ctx.restore();
    }, [viewCenter, zoom, validMoves, hoveredSpace]);

    // Helper function for rounded rectangles
    const roundRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    // Enhanced player rendering with character sprites
    const drawPlayers = (ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight) => {
        if (!boardManager || !game || !game.players) return;

        const playersArray = Array.isArray(game.players) ? game.players : [];
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

        playersOnSpaces.forEach((players, spaceId) => {
            const space = visibleSpaces.find(s => s.id === spaceId);
            if (!space) return;

            const spaceX = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
            const spaceY = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;

            players.forEach((player, index) => {
                const playerIndex = playersArray.findIndex(p => p.userId === player.userId);
                const colorScheme = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
                
                const angle = (index / players.length) * 2 * Math.PI;
                const radius = players.length > 1 ? spaceSize * 0.35 : 0;
                const x = spaceX + Math.cos(angle) * radius;
                const y = spaceY + Math.sin(angle) * radius;

                // Draw player shadow
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(x, y + PLAYER_SIZE * zoom * 0.45, PLAYER_SIZE * zoom * 0.35, PLAYER_SIZE * zoom * 0.15, 0, 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();

                // Draw player glow
                const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, PLAYER_SIZE * zoom * 0.6);
                glowGradient.addColorStop(0, colorScheme.glow + '40');
                glowGradient.addColorStop(1, colorScheme.glow + '00');
                ctx.fillStyle = glowGradient;
                ctx.fillRect(x - PLAYER_SIZE * zoom, y - PLAYER_SIZE * zoom, PLAYER_SIZE * zoom * 2, PLAYER_SIZE * zoom * 2);

                // Draw player piece
                ctx.save();
                ctx.shadowColor = colorScheme.primary;
                ctx.shadowBlur = 10;
                
                // Outer ring
                ctx.fillStyle = colorScheme.primary;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, PLAYER_SIZE * zoom * 0.4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // Inner circle
                ctx.fillStyle = colorScheme.secondary;
                ctx.beginPath();
                ctx.arc(x, y, PLAYER_SIZE * zoom * 0.25, 0, 2 * Math.PI);
                ctx.fill();

                // Player indicator (current player gets a crown)
                if (currentPlayer && player.userId === currentPlayer.userId) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.font = `${PLAYER_SIZE * zoom * 0.5}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('👑', x, y - PLAYER_SIZE * zoom * 0.7);
                }

                // Draw player name
                if (zoom > 1.0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 4;
                    ctx.font = `bold ${Math.max(12, PLAYER_SIZE * zoom * 0.5)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    
                    const name = player.name || player.displayName || `Player ${playerIndex + 1}`;
                    const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
                    
                    ctx.strokeText(shortName, x, y + PLAYER_SIZE * zoom * 0.5);
                    ctx.fillText(shortName, x, y + PLAYER_SIZE * zoom * 0.5);
                }

                ctx.restore();
            });
        });
    };

    // Enhanced connection drawing with animated flow
    const drawSpaceConnections = useCallback((ctx, spaces, spaceSize, canvasWidth, canvasHeight, deltaTime) => {
        const time = Date.now() * 0.001;
        const drawnConnections = new Set();

        spaces.forEach(space => {
            if (!space.connections) return;

            space.connections.forEach(targetId => {
                const connectionKey = `${Math.min(space.id, targetId)}-${Math.max(space.id, targetId)}`;
                if (drawnConnections.has(connectionKey)) return;
                drawnConnections.add(connectionKey);

                const targetSpace = spaces.find(s => s.id === targetId);
                if (!targetSpace) return;

                const x1 = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
                const y1 = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
                const x2 = (targetSpace.x - viewCenter.x) * spaceSize + canvasWidth / 2;
                const y2 = (targetSpace.y - viewCenter.y) * spaceSize + canvasHeight / 2;

                // Draw path shadow
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = spaceSize * 0.25;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowOffsetY = 3;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.restore();

                // Draw main path
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, board?.theme?.pathColor || '#fbbf24');
                gradient.addColorStop(1, board?.theme?.pathColor || '#f59e0b');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = spaceSize * 0.2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Draw animated dots along the path
                const distance = Math.hypot(x2 - x1, y2 - y1);
                const numDots = Math.floor(distance / 30);
                
                for (let i = 0; i < numDots; i++) {
                    const progress = ((i / numDots + time * 0.2) % 1);
                    const dotX = x1 + (x2 - x1) * progress;
                    const dotY = y1 + (y2 - y1) * progress;
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
    }, [viewCenter, zoom, board?.theme?.pathColor]);

    // Update particles
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(prev => {
                const updated = prev.filter(p => p.life > 0);
                updated.forEach(p => p.update());
                return updated;
            });
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, []);

    // Main render loop
    const renderBoard = useCallback((deltaTime) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const spaceSize = SPACE_SIZE * zoom;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Draw animated background
        drawThemeBackground(ctx, canvasWidth, canvasHeight, deltaTime);

        // Calculate visible spaces
        const visibleSpaces = board.spaces.filter(space => {
            const screenX = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
            const screenY = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
            return screenX > -spaceSize && screenX < canvasWidth + spaceSize &&
                   screenY > -spaceSize && screenY < canvasHeight + spaceSize;
        });

        // Draw connections with animation
        drawSpaceConnections(ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight, deltaTime);

        // Draw spaces
        visibleSpaces.forEach(space => {
            drawSpace(ctx, space, spaceSize, canvasWidth, canvasHeight, deltaTime);
        });

        // Draw players
        drawPlayers(ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight);

        // Draw particles
        particles.forEach(particle => particle.draw(ctx));

        // Draw minimap
        if (showMinimap && minimapRef.current) {
            drawMinimap();
        }
    }, [board, viewCenter, zoom, drawThemeBackground, drawSpace, drawSpaceConnections, particles, showMinimap]);

    // Animation loop
    useEffect(() => {
        const animate = (timestamp) => {
            const deltaTime = timestamp - lastUpdateTime.current;
            lastUpdateTime.current = timestamp;

            renderBoard(deltaTime);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [renderBoard]);

    // Draw minimap
    const drawMinimap = useCallback(() => {
        if (!board || !minimapRef.current) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');
        const scale = MINIMAP_SIZE / Math.max(board.width, board.height);

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Draw spaces
        board.spaces.forEach(space => {
            const x = space.x * scale;
            const y = space.y * scale;
            
            ctx.fillStyle = SPACE_TYPES[space.type]?.color || '#60a5fa';
            ctx.fillRect(x - 2, y - 2, 4, 4);
        });

        // Draw viewport
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const viewWidth = (canvasRef.current.width / zoom / SPACE_SIZE) * scale;
        const viewHeight = (canvasRef.current.height / zoom / SPACE_SIZE) * scale;
        const viewX = (viewCenter.x - canvasRef.current.width / zoom / SPACE_SIZE / 2) * scale;
        const viewY = (viewCenter.y - canvasRef.current.height / zoom / SPACE_SIZE / 2) * scale;
        ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
    }, [board, viewCenter, zoom]);

    // Handle mouse movement for hover effects
    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas || !board) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mousePos.current = { x, y };

        // Find hovered space
        const spaceSize = SPACE_SIZE * zoom;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        let foundSpace = null;
        for (const space of board.spaces) {
            const spaceX = (space.x - viewCenter.x) * spaceSize + canvasWidth / 2;
            const spaceY = (space.y - viewCenter.y) * spaceSize + canvasHeight / 2;
            const size = spaceSize * 0.8;

            if (x >= spaceX - size/2 && x <= spaceX + size/2 &&
                y >= spaceY - size/2 && y <= spaceY + size/2) {
                foundSpace = space.id;
                break;
            }
        }

        setHoveredSpace(foundSpace);
    }, [board, viewCenter, zoom]);

    // Handle canvas click
    const handleCanvasClick = useCallback((e) => {
        if (hoveredSpace !== null && onSpaceClick) {
            onSpaceClick(hoveredSpace);
            
            // Create particle effect
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const newParticles = [];
            for (let i = 0; i < 10; i++) {
                newParticles.push(new Particle(x, y, Math.random() > 0.5 ? 'star' : 'coin'));
            }
            setParticles(prev => [...prev, ...newParticles]);
        }
    }, [hoveredSpace, onSpaceClick]);

    // Handle zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
    }, []);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-pointer"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
            />
            
            {showMinimap && (
                <div className="absolute top-4 right-4 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
                    <canvas
                        ref={minimapRef}
                        width={MINIMAP_SIZE}
                        height={MINIMAP_SIZE}
                        className="bg-gray-800"
                    />
                </div>
            )}

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                    onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
                    className="bg-gray-800 bg-opacity-80 text-white p-2 rounded-lg hover:bg-opacity-100 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                </button>
                <button
                    onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
                    className="bg-gray-800 bg-opacity-80 text-white p-2 rounded-lg hover:bg-opacity-100 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                </button>
                <button
                    onClick={() => setShowMinimap(!showMinimap)}
                    className="bg-gray-800 bg-opacity-80 text-white p-2 rounded-lg hover:bg-opacity-100 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BoardRenderer;