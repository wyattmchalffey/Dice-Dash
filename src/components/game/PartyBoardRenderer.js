// src/components/game/PartyBoardRenderer.js
// Enhanced party-style board renderer with Mario Party feel

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PARTY_SPACE_TYPES } from '../../systems/party-board-system';

const PartyBoardRenderer = ({ 
    board, 
    boardManager, 
    currentPlayer, 
    game,
    onSpaceClick, 
    onPlayerMove, 
    validMoves = [],
    selectedSpace = null 
}) => {
    const [viewCenter, setViewCenter] = useState({ x: 50, y: 50 });
    const [zoom, setZoom] = useState(0.8);
    const [showMinimap, setShowMinimap] = useState(true);
    const [animatingPlayers, setAnimatingPlayers] = useState(new Set());
    const [spaceAnimations, setSpaceAnimations] = useState({});
    const [hoveredSpace, setHoveredSpace] = useState(null);

    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const animationRef = useRef(null);
    const lastUpdateTime = useRef(0);

    // Party game styling constants
    const SPACE_SIZE = 48;
    const SPACE_BORDER_WIDTH = 4;
    const PLAYER_SIZE = 24;
    const MINIMAP_SIZE = 200;
    const ANIMATION_SPEED = 0.05;

    // Initialize view center based on current player
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

    // Main animation loop
    useEffect(() => {
        const animate = (currentTime) => {
            const deltaTime = currentTime - lastUpdateTime.current;
            lastUpdateTime.current = currentTime;

            renderBoard(deltaTime);
            renderMinimap();
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [board, boardManager, viewCenter, zoom, validMoves, selectedSpace, game, currentPlayer]);

    // Main board rendering function
    const renderBoard = useCallback((deltaTime) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const spaceSize = SPACE_SIZE * zoom;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Clear canvas with theme background
        drawThemeBackground(ctx, canvasWidth, canvasHeight);

        // Calculate visible area
        const viewRadius = Math.max(canvasWidth, canvasHeight) / spaceSize / 2 + 5;
        const visibleSpaces = board.spaces.filter(space => {
            const dx = Math.abs(space.x - viewCenter.x);
            const dy = Math.abs(space.y - viewCenter.y);
            return dx <= viewRadius && dy <= viewRadius;
        });

        // Draw connections between spaces
        drawSpaceConnections(ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight);

        // Draw decorative elements
        drawThemeDecorations(ctx, board.decorations, spaceSize, canvasWidth, canvasHeight);

        // Draw landmarks
        drawLandmarks(ctx, board.landmarks, spaceSize, canvasWidth, canvasHeight);

        // Draw spaces
        visibleSpaces.forEach(space => {
            drawPartySpace(ctx, space, spaceSize, canvasWidth, canvasHeight, deltaTime);
        });

        // Draw players
        drawPlayers(ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight);

        // Draw UI overlays
        drawUIOverlays(ctx, canvasWidth, canvasHeight);

    }, [board, boardManager, viewCenter, zoom, validMoves, selectedSpace, game, currentPlayer, spaceAnimations, hoveredSpace]);

    // Draw theme-appropriate background
    const drawThemeBackground = (ctx, width, height) => {
        if (!board.theme) return;

        // Create gradient background based on theme
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, board.theme.backgroundColor);
        gradient.addColorStop(1, adjustBrightness(board.theme.backgroundColor, -20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add texture pattern
        drawTexturePattern(ctx, width, height, board.theme.backgroundPattern);
    };

    // Draw space connections with party game style
    const drawSpaceConnections = (ctx, spaces, spaceSize, canvasWidth, canvasHeight) => {
        ctx.save();
        
        // Draw main path connections
        const mainPathSpaces = spaces.filter(space => space.pathType === 'main').sort((a, b) => a.pathIndex - b.pathIndex);
        
        if (mainPathSpaces.length > 1) {
            ctx.strokeStyle = board.theme.pathColor;
            ctx.lineWidth = 8 * zoom;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Add glow effect to path
            ctx.shadowColor = board.theme.pathColor;
            ctx.shadowBlur = 15 * zoom;
            
            ctx.beginPath();
            for (let i = 0; i < mainPathSpaces.length; i++) {
                const space = mainPathSpaces[i];
                const screenPos = worldToScreen(space.x, space.y, spaceSize, canvasWidth, canvasHeight);
                
                if (i === 0) {
                    ctx.moveTo(screenPos.x, screenPos.y);
                } else {
                    ctx.lineTo(screenPos.x, screenPos.y);
                }
            }
            // Connect back to start for circular path
            if (mainPathSpaces.length > 2) {
                const firstSpace = mainPathSpaces[0];
                const screenPos = worldToScreen(firstSpace.x, firstSpace.y, spaceSize, canvasWidth, canvasHeight);
                ctx.lineTo(screenPos.x, screenPos.y);
            }
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }

        // Draw branch connections
        const branchSpaces = spaces.filter(space => space.pathType === 'branch');
        const branchGroups = groupSpacesByBranch(branchSpaces);
        
        Object.values(branchGroups).forEach(branch => {
            if (branch.length > 1) {
                ctx.strokeStyle = adjustBrightness(board.theme.pathColor, -30);
                ctx.lineWidth = 6 * zoom;
                
                ctx.beginPath();
                for (let i = 0; i < branch.length; i++) {
                    const space = branch[i];
                    const screenPos = worldToScreen(space.x, space.y, spaceSize, canvasWidth, canvasHeight);
                    
                    if (i === 0) {
                        ctx.moveTo(screenPos.x, screenPos.y);
                    } else {
                        ctx.lineTo(screenPos.x, screenPos.y);
                    }
                }
                ctx.stroke();
            }
        });
        
        ctx.restore();
    };

    // Draw individual party-style space
    const drawPartySpace = (ctx, space, spaceSize, canvasWidth, canvasHeight, deltaTime) => {
        const screenPos = worldToScreen(space.x, space.y, spaceSize, canvasWidth, canvasHeight);
        const spaceType = PARTY_SPACE_TYPES[space.type];
        
        if (!spaceType) return;

        ctx.save();

        // Apply space animations
        const animation = spaceAnimations[space.id];
        if (animation) {
            updateSpaceAnimation(space.id, deltaTime);
            applyAnimationTransform(ctx, screenPos, animation);
        }

        // Draw space shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8 * zoom;
        ctx.shadowOffsetX = 3 * zoom;
        ctx.shadowOffsetY = 3 * zoom;

        // Draw space background
        const radius = spaceSize / 2;
        ctx.fillStyle = spaceType.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Remove shadow for border
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw space border
        ctx.strokeStyle = adjustBrightness(spaceType.color, -40);
        ctx.lineWidth = SPACE_BORDER_WIDTH * zoom;
        ctx.stroke();

        // Draw inner highlight
        ctx.strokeStyle = adjustBrightness(spaceType.color, 40);
        ctx.lineWidth = 2 * zoom;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius - (SPACE_BORDER_WIDTH * zoom), 0, Math.PI * 2);
        ctx.stroke();

        // Draw space icon/symbol
        drawSpaceIcon(ctx, screenPos, spaceType, radius * 0.6);

        // Draw special effects for space type
        drawSpaceEffects(ctx, screenPos, spaceType, radius, deltaTime);

        // Highlight valid moves
        if (validMoves.includes(space.id)) {
            drawValidMoveIndicator(ctx, screenPos, radius);
        }

        // Highlight selected space
        if (selectedSpace && selectedSpace.id === space.id) {
            drawSelectedSpaceIndicator(ctx, screenPos, radius);
        }

        // Highlight hovered space
        if (hoveredSpace && hoveredSpace.id === space.id) {
            drawHoverIndicator(ctx, screenPos, radius);
        }

        ctx.restore();
    };

    // Draw space icon based on type
    const drawSpaceIcon = (ctx, pos, spaceType, size) => {
        ctx.save();
        ctx.fillStyle = spaceType.textColor;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw emoji icon if available
        if (spaceType.icon) {
            ctx.fillText(spaceType.icon, pos.x, pos.y);
        } else {
            // Draw text abbreviation
            const abbrev = spaceType.name.charAt(0);
            ctx.fillText(abbrev, pos.x, pos.y);
        }
        
        ctx.restore();
    };

    // Draw special effects for different space types
    const drawSpaceEffects = (ctx, pos, spaceType, radius, deltaTime) => {
        const time = Date.now() * 0.001; // Convert to seconds
        
        switch (spaceType.id) {
            case 'STAR':
                // Twinkling star effect
                drawTwinkleEffect(ctx, pos, radius * 1.5, time);
                break;
                
            case 'MINIGAME':
                // Pulsing glow effect
                drawPulsingGlow(ctx, pos, radius, time, '#ec4899');
                break;
                
            case 'CHANCE':
                // Rainbow rotating effect
                drawRainbowEffect(ctx, pos, radius, time);
                break;
                
            case 'WARP':
                // Swirling portal effect
                drawPortalEffect(ctx, pos, radius, time);
                break;
                
            case 'VILLAIN':
                // Dark menacing aura
                drawMenacingAura(ctx, pos, radius, time);
                break;
        }
    };

    // Draw twinkling effect for star spaces
    const drawTwinkleEffect = (ctx, pos, radius, time) => {
        ctx.save();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const distance = radius + Math.sin(time * 2 + i) * 10;
            const x = pos.x + Math.cos(angle) * distance;
            const y = pos.y + Math.sin(angle) * distance;
            const opacity = (Math.sin(time * 3 + i) + 1) / 2;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, 3 * zoom, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    };

    // Draw pulsing glow effect
    const drawPulsingGlow = (ctx, pos, radius, time, color) => {
        ctx.save();
        
        const pulse = (Math.sin(time * 4) + 1) / 2;
        const glowRadius = radius * (1.2 + pulse * 0.3);
        
        const gradient = ctx.createRadialGradient(pos.x, pos.y, radius, pos.x, pos.y, glowRadius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `${color}40`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    };

    // Draw rainbow effect for chance spaces
    const drawRainbowEffect = (ctx, pos, radius, time) => {
        ctx.save();
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time * 2;
            const hue = (i * 30 + time * 60) % 360;
            const distance = radius * 1.3;
            const x = pos.x + Math.cos(angle) * distance;
            const y = pos.y + Math.sin(angle) * distance;
            
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.beginPath();
            ctx.arc(x, y, 2 * zoom, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    };

    // Draw portal effect for warp spaces
    const drawPortalEffect = (ctx, pos, radius, time) => {
        ctx.save();
        
        for (let i = 0; i < 3; i++) {
            const spiralRadius = radius * (0.8 + i * 0.3);
            const spiralTime = time + i * 0.5;
            
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.6 - i * 0.2})`;
            ctx.lineWidth = 3 * zoom;
            ctx.beginPath();
            
            for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                const currentRadius = spiralRadius * (1 - angle / (Math.PI * 4));
                const x = pos.x + Math.cos(angle + spiralTime) * currentRadius;
                const y = pos.y + Math.sin(angle + spiralTime) * currentRadius;
                
                if (angle === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    };

    // Draw menacing aura for villain spaces
    const drawMenacingAura = (ctx, pos, radius, time) => {
        ctx.save();
        
        const auraRadius = radius * (1.5 + Math.sin(time * 3) * 0.2);
        const gradient = ctx.createRadialGradient(pos.x, pos.y, radius, pos.x, pos.y, auraRadius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, 'rgba(124, 45, 18, 0.3)');
        gradient.addColorStop(1, 'rgba(124, 45, 18, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add flickering dark particles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 0.5;
            const distance = radius + Math.random() * 20;
            const x = pos.x + Math.cos(angle) * distance;
            const y = pos.y + Math.sin(angle) * distance;
            const opacity = Math.random() * 0.5;
            
            ctx.fillStyle = `rgba(50, 20, 10, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, 2 * zoom, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    };

    // Draw valid move indicator
    const drawValidMoveIndicator = (ctx, pos, radius) => {
        ctx.save();
        
        const time = Date.now() * 0.003;
        const pulse = (Math.sin(time) + 1) / 2;
        const glowRadius = radius * (1.4 + pulse * 0.2);
        
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.8 - pulse * 0.3})`;
        ctx.lineWidth = 4 * zoom;
        ctx.setLineDash([5 * zoom, 5 * zoom]);
        ctx.lineDashOffset = time * 20;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    };

    // Draw selected space indicator
    const drawSelectedSpaceIndicator = (ctx, pos, radius) => {
        ctx.save();
        
        const time = Date.now() * 0.005;
        const pulse = (Math.sin(time) + 1) / 2;
        
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.9 - pulse * 0.2})`;
        ctx.lineWidth = 6 * zoom;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * (1.3 + pulse * 0.1), 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    };

    // Draw hover indicator
    const drawHoverIndicator = (ctx, pos, radius) => {
        ctx.save();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 3 * zoom;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    };

    // Draw players on the board
    const drawPlayers = (ctx, visibleSpaces, spaceSize, canvasWidth, canvasHeight) => {
        if (!game || !game.players || !boardManager) return;

        game.players.forEach((player, playerIndex) => {
            const position = boardManager.playerPositions.get(player.userId);
            if (position === undefined) return;

            const space = visibleSpaces.find(s => s.id === position);
            if (!space) return;

            const basePos = worldToScreen(space.x, space.y, spaceSize, canvasWidth, canvasHeight);
            
            // Offset players if multiple on same space
            const playersOnSpace = game.players.filter(p => 
                boardManager.playerPositions.get(p.userId) === position
            );
            const playerOffset = getPlayerOffset(playerIndex, playersOnSpace.length);
            
            const playerPos = {
                x: basePos.x + playerOffset.x * zoom,
                y: basePos.y + playerOffset.y * zoom
            };

            drawPlayer(ctx, player, playerPos, PLAYER_SIZE * zoom, playerIndex);
        });
    };

    // Draw individual player
    const drawPlayer = (ctx, player, pos, size, playerIndex) => {
        ctx.save();

        // Draw player shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6 * zoom;
        ctx.shadowOffsetX = 2 * zoom;
        ctx.shadowOffsetY = 2 * zoom;

        // Draw player body
        ctx.fillStyle = player.color || getPlayerColor(playerIndex);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Remove shadow for details
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw player border
        ctx.strokeStyle = adjustBrightness(player.color || getPlayerColor(playerIndex), -40);
        ctx.lineWidth = 3 * zoom;
        ctx.stroke();

        // Draw player highlight
        ctx.strokeStyle = adjustBrightness(player.color || getPlayerColor(playerIndex), 60);
        ctx.lineWidth = 1 * zoom;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2 - 2 * zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Draw player name
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * zoom;
        ctx.font = `bold ${10 * zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const nameY = pos.y + size / 2 + 5 * zoom;
        ctx.strokeText(player.name, pos.x, nameY);
        ctx.fillText(player.name, pos.x, nameY);

        // Draw current player indicator
        if (currentPlayer && player.userId === currentPlayer.userId) {
            drawCurrentPlayerIndicator(ctx, pos, size);
        }

        ctx.restore();
    };

    // Draw current player indicator
    const drawCurrentPlayerIndicator = (ctx, pos, size) => {
        const time = Date.now() * 0.005;
        const pulse = (Math.sin(time) + 1) / 2;
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 - pulse * 0.3})`;
        ctx.lineWidth = 4 * zoom;
        ctx.setLineDash([3 * zoom, 3 * zoom]);
        ctx.lineDashOffset = time * 15;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (size / 2) * (1.5 + pulse * 0.2), 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    };

    // Get player offset for multiple players on same space
    const getPlayerOffset = (playerIndex, totalPlayers) => {
        if (totalPlayers === 1) return { x: 0, y: 0 };
        
        const angle = (playerIndex / totalPlayers) * Math.PI * 2;
        const distance = 15;
        
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance
        };
    };

    // Get default player colors
    const getPlayerColor = (index) => {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        return colors[index % colors.length];
    };

    // Draw theme decorations
    const drawThemeDecorations = (ctx, decorations, spaceSize, canvasWidth, canvasHeight) => {
        if (!decorations) return;

        decorations.forEach(decoration => {
            const screenPos = worldToScreen(decoration.x, decoration.y, spaceSize, canvasWidth, canvasHeight);
            
            // Only draw if in visible area
            if (screenPos.x >= -50 && screenPos.x <= canvasWidth + 50 && 
                screenPos.y >= -50 && screenPos.y <= canvasHeight + 50) {
                drawDecoration(ctx, decoration, screenPos);
            }
        });
    };

    // Draw individual decoration
    const drawDecoration = (ctx, decoration, pos) => {
        ctx.save();
        ctx.globalAlpha = decoration.opacity || 1;
        
        // Apply rotation
        if (decoration.rotation) {
            ctx.translate(pos.x, pos.y);
            ctx.rotate(decoration.rotation * Math.PI / 180);
            ctx.translate(-pos.x, -pos.y);
        }
        
        // Draw decoration based on type
        const size = (decoration.size || 1) * 20 * zoom;
        drawDecorationByType(ctx, decoration.type, pos, size);
        
        ctx.restore();
    };

    // Draw decoration by type
    const drawDecorationByType = (ctx, type, pos, size) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        switch (type) {
            case 'crystal_shard':
                drawCrystalShard(ctx, pos, size);
                break;
            case 'magic_sparkle':
                drawMagicSparkle(ctx, pos, size);
                break;
            case 'lava_rock':
                drawLavaRock(ctx, pos, size);
                break;
            case 'fire_ember':
                drawFireEmber(ctx, pos, size);
                break;
            default:
                // Generic decoration
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
                ctx.fill();
        }
    };

    // Draw crystal shard decoration
    const drawCrystalShard = (ctx, pos, size) => {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - size);
        ctx.lineTo(pos.x + size * 0.6, pos.y);
        ctx.lineTo(pos.x, pos.y + size);
        ctx.lineTo(pos.x - size * 0.6, pos.y);
        ctx.closePath();
        ctx.fill();
    };

    // Draw magic sparkle decoration
    const drawMagicSparkle = (ctx, pos, size) => {
        const time = Date.now() * 0.003;
        ctx.fillStyle = `rgba(255, 215, 0, ${(Math.sin(time) + 1) / 4 + 0.3})`;
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + time;
            const x = pos.x + Math.cos(angle) * size * 0.3;
            const y = pos.y + Math.sin(angle) * size * 0.3;
            
            ctx.beginPath();
            ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    // Draw lava rock decoration
    const drawLavaRock = (ctx, pos, size) => {
        ctx.fillStyle = 'rgba(124, 45, 18, 0.6)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 3, 0, Math.PI * 2);
        ctx.fill();
    };

    // Draw fire ember decoration
    const drawFireEmber = (ctx, pos, size) => {
        const time = Date.now() * 0.005;
        const flicker = Math.sin(time * 10) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(239, 68, 68, ${flicker * 0.6})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * flicker / 2, 0, Math.PI * 2);
        ctx.fill();
    };

    // Draw landmarks
    const drawLandmarks = (ctx, landmarks, spaceSize, canvasWidth, canvasHeight) => {
        if (!landmarks) return;

        landmarks.forEach(landmark => {
            const screenPos = worldToScreen(landmark.x, landmark.y, spaceSize, canvasWidth, canvasHeight);
            
            if (screenPos.x >= -100 && screenPos.x <= canvasWidth + 100 && 
                screenPos.y >= -100 && screenPos.y <= canvasHeight + 100) {
                drawLandmark(ctx, landmark, screenPos);
            }
        });
    };

    // Draw individual landmark
    const drawLandmark = (ctx, landmark, pos) => {
        ctx.save();
        
        const sizes = { large: 60, medium: 40, small: 25 };
        const size = (sizes[landmark.size] || 30) * zoom;
        
        // Draw landmark shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10 * zoom;
        ctx.shadowOffsetX = 3 * zoom;
        ctx.shadowOffsetY = 3 * zoom;
        
        // Draw landmark base
        ctx.fillStyle = board.theme.decorativeColor;
        ctx.beginPath();
        
        if (landmark.type === 'main_structure') {
            // Draw main structure as a castle/tower
            ctx.rect(pos.x - size/2, pos.y - size, size, size);
            ctx.fill();
            
            // Add tower top
            ctx.beginPath();
            ctx.moveTo(pos.x - size/2, pos.y - size);
            ctx.lineTo(pos.x, pos.y - size * 1.3);
            ctx.lineTo(pos.x + size/2, pos.y - size);
            ctx.fill();
        } else {
            // Draw corner structures as smaller buildings
            ctx.rect(pos.x - size/3, pos.y - size*0.7, size*0.66, size*0.7);
            ctx.fill();
        }
        
        // Draw landmark name
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * zoom;
        ctx.font = `bold ${12 * zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const nameY = pos.y + 5 * zoom;
        ctx.strokeText(landmark.name, pos.x, nameY);
        ctx.fillText(landmark.name, pos.x, nameY);
        
        ctx.restore();
    };

    // Draw UI overlays
    const drawUIOverlays = (ctx, canvasWidth, canvasHeight) => {
        // Draw zoom controls
        drawZoomControls(ctx, canvasWidth, canvasHeight);
        
        // Draw view controls info
        drawViewControlsInfo(ctx, canvasWidth, canvasHeight);
    };

    // Draw zoom controls
    const drawZoomControls = (ctx, canvasWidth, canvasHeight) => {
        ctx.save();
        
        const controlsX = canvasWidth - 80;
        const controlsY = 20;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(controlsX, controlsY, 60, 80);
        
        // Zoom level indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(zoom * 100)}%`, controlsX + 30, controlsY + 50);
        
        ctx.restore();
    };

    // Draw view controls info
    const drawViewControlsInfo = (ctx, canvasWidth, canvasHeight) => {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvasHeight - 80, 200, 70);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        const instructions = [
            'Arrow Keys: Move view',
            'Mouse Wheel: Zoom',
            'Click: Select space',
            'M: Toggle minimap'
        ];
        
        instructions.forEach((text, index) => {
            ctx.fillText(text, 15, canvasHeight - 60 + (index * 15));
        });
        
        ctx.restore();
    };

    // Render minimap
    const renderMinimap = useCallback(() => {
        if (!board || !minimapRef.current || !showMinimap) return;

        const canvas = minimapRef.current;
        const ctx = canvas.getContext('2d');
        const scale = MINIMAP_SIZE / Math.max(board.width, board.height);

        // Clear minimap
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Draw border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

        // Draw spaces
        board.spaces.forEach(space => {
            const spaceType = PARTY_SPACE_TYPES[space.type];
            ctx.fillStyle = spaceType?.color || '#6b7280';
            ctx.fillRect(
                space.x * scale - 1,
                space.y * scale - 1,
                3,
                3
            );
        });

        // Draw viewport indicator
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        const viewSize = 20;
        ctx.strokeRect(
            (viewCenter.x - viewSize/2) * scale,
            (viewCenter.y - viewSize/2) * scale,
            viewSize * scale,
            viewSize * scale
        );

        // Draw players on minimap
        if (game && game.players && boardManager) {
            game.players.forEach((player, index) => {
                const position = boardManager.playerPositions.get(player.userId);
                if (position !== undefined) {
                    const space = board.spaces.find(s => s.id === position);
                    if (space) {
                        ctx.fillStyle = player.color || getPlayerColor(index);
                        ctx.beginPath();
                        ctx.arc(space.x * scale, space.y * scale, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        }
    }, [board, boardManager, viewCenter, showMinimap, game, zoom]);

    // Handle canvas click events
    const handleCanvasClick = useCallback((e) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const spaceSize = SPACE_SIZE * zoom;
        const worldPos = screenToWorld(x, y, spaceSize, canvas.width, canvas.height);

        // Find clicked space
        const clickedSpace = board.spaces.find(space => {
            const dx = Math.abs(space.x - worldPos.x);
            const dy = Math.abs(space.y - worldPos.y);
            return Math.sqrt(dx * dx + dy * dy) < 1.5;
        });

        if (clickedSpace && onSpaceClick) {
            onSpaceClick(clickedSpace);
            triggerSpaceAnimation(clickedSpace.id, 'click');
        }
    }, [board, zoom, onSpaceClick]);

    // Handle mouse move for hover effects
    const handleMouseMove = useCallback((e) => {
        if (!board || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const spaceSize = SPACE_SIZE * zoom;
        const worldPos = screenToWorld(x, y, spaceSize, canvas.width, canvas.height);

        // Find hovered space
        const hoveredSpace = board.spaces.find(space => {
            const dx = Math.abs(space.x - worldPos.x);
            const dy = Math.abs(space.y - worldPos.y);
            return Math.sqrt(dx * dx + dy * dy) < 1.5;
        });

        setHoveredSpace(hoveredSpace);
    }, [board, zoom]);

    // Handle minimap click
    const handleMinimapClick = useCallback((e) => {
        if (!minimapRef.current || !board) return;

        const rect = minimapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scale = MINIMAP_SIZE / Math.max(board.width, board.height);

        setViewCenter({
            x: x / scale,
            y: y / scale
        });
    }, [board]);

    // Handle keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            const moveSpeed = 5;
            const zoomSpeed = 0.1;

            switch(e.key) {
                case 'ArrowUp':
                    setViewCenter(prev => ({ ...prev, y: prev.y - moveSpeed }));
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    setViewCenter(prev => ({ ...prev, y: prev.y + moveSpeed }));
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    setViewCenter(prev => ({ ...prev, x: prev.x - moveSpeed }));
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    setViewCenter(prev => ({ ...prev, x: prev.x + moveSpeed }));
                    e.preventDefault();
                    break;
                case '=':
                case '+':
                    setZoom(prev => Math.min(prev + zoomSpeed, 3));
                    e.preventDefault();
                    break;
                case '-':
                    setZoom(prev => Math.max(prev - zoomSpeed, 0.3));
                    e.preventDefault();
                    break;
                case 'm':
                case 'M':
                    setShowMinimap(prev => !prev);
                    e.preventDefault();
                    break;
            }
        };

        const handleWheel = (e) => {
            const zoomSpeed = 0.001;
            const delta = -e.deltaY * zoomSpeed;
            setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
            e.preventDefault();
        };

        window.addEventListener('keydown', handleKeyPress);
        if (canvasRef.current) {
            canvasRef.current.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    // Utility functions
    const worldToScreen = (worldX, worldY, spaceSize, canvasWidth, canvasHeight) => {
        return {
            x: (worldX - viewCenter.x) * spaceSize + canvasWidth / 2,
            y: (worldY - viewCenter.y) * spaceSize + canvasHeight / 2
        };
    };

    const screenToWorld = (screenX, screenY, spaceSize, canvasWidth, canvasHeight) => {
        return {
            x: (screenX - canvasWidth / 2) / spaceSize + viewCenter.x,
            y: (screenY - canvasHeight / 2) / spaceSize + viewCenter.y
        };
    };

    const adjustBrightness = (color, amount) => {
        // Simple brightness adjustment for hex colors
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    const groupSpacesByBranch = (branchSpaces) => {
        return branchSpaces.reduce((groups, space) => {
            const branchId = space.branchId;
            if (!groups[branchId]) groups[branchId] = [];
            groups[branchId].push(space);
            return groups;
        }, {});
    };

    const drawTexturePattern = (ctx, width, height, pattern) => {
        ctx.save();
        ctx.globalAlpha = 0.1;
        
        switch (pattern) {
            case 'castle_stones':
                drawStonePattern(ctx, width, height);
                break;
            case 'volcanic_rock':
                drawVolcanicPattern(ctx, width, height);
                break;
            case 'checkered_pattern':
                drawCheckeredPattern(ctx, width, height);
                break;
            case 'ocean_waves':
                drawWavePattern(ctx, width, height);
                break;
            case 'starfield':
                drawStarPattern(ctx, width, height);
                break;
        }
        
        ctx.restore();
    };

    const drawStonePattern = (ctx, width, height) => {
        ctx.fillStyle = '#ffffff';
        for (let x = 0; x < width; x += 40) {
            for (let y = 0; y < height; y += 40) {
                if ((x + y) % 80 === 0) {
                    ctx.fillRect(x, y, 38, 38);
                }
            }
        }
    };

    const drawVolcanicPattern = (ctx, width, height) => {
        ctx.fillStyle = '#ff4400';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 5 + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawCheckeredPattern = (ctx, width, height) => {
        ctx.fillStyle = '#ffffff';
        const size = 30;
        for (let x = 0; x < width; x += size) {
            for (let y = 0; y < height; y += size) {
                if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
                    ctx.fillRect(x, y, size, size);
                }
            }
        }
    };

    const drawWavePattern = (ctx, width, height) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            for (let x = 0; x <= width; x += 5) {
                const waveY = y + Math.sin(x * 0.02) * 5;
                if (x === 0) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }
    };

    const drawStarPattern = (ctx, width, height) => {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    // Animation system
    const triggerSpaceAnimation = (spaceId, type) => {
        setSpaceAnimations(prev => ({
            ...prev,
            [spaceId]: {
                type,
                startTime: Date.now(),
                duration: 1000
            }
        }));
    };

    const updateSpaceAnimation = (spaceId, deltaTime) => {
        setSpaceAnimations(prev => {
            const animation = prev[spaceId];
            if (!animation) return prev;

            const elapsed = Date.now() - animation.startTime;
            if (elapsed >= animation.duration) {
                const updated = { ...prev };
                delete updated[spaceId];
                return updated;
            }

            return prev;
        });
    };

    const applyAnimationTransform = (ctx, pos, animation) => {
        const elapsed = Date.now() - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);

        switch (animation.type) {
            case 'click':
                const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
                ctx.translate(pos.x, pos.y);
                ctx.scale(scale, scale);
                ctx.translate(-pos.x, -pos.y);
                break;
        }
    };

    return (
        <div className="relative w-full h-full bg-gray-900 overflow-hidden">
            {/* Main game board canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-pointer"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                style={{ imageRendering: 'pixelated' }}
            />

            {/* Minimap */}
            {showMinimap && (
                <div className="absolute top-4 left-4 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden">
                    <canvas
                        ref={minimapRef}
                        width={MINIMAP_SIZE}
                        height={MINIMAP_SIZE}
                        className="cursor-pointer"
                        onClick={handleMinimapClick}
                    />
                    <div className="absolute bottom-1 left-1 text-xs text-white">
                        Minimap
                    </div>
                </div>
            )}

            {/* Space info panel */}
            {hoveredSpace && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg min-w-48">
                    <div className="font-bold text-lg mb-1">
                        {PARTY_SPACE_TYPES[hoveredSpace.type]?.name || hoveredSpace.type}
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                        {PARTY_SPACE_TYPES[hoveredSpace.type]?.description || 'Special space'}
                    </div>
                    <div className="text-xs text-gray-400">
                        Position: ({hoveredSpace.x}, {hoveredSpace.y})
                    </div>
                    {hoveredSpace.pathType && (
                        <div className="text-xs text-gray-400">
                            Path: {hoveredSpace.pathType}
                        </div>
                    )}
                </div>
            )}

            {/* Control hints */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
                <div>🎮 Controls:</div>
                <div>← → ↑ ↓ Move view</div>
                <div>Mouse wheel: Zoom</div>
                <div>M: Toggle minimap</div>
                <div>Click: Select space</div>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
                Zoom: {Math.round(zoom * 100)}%
            </div>
        </div>
    );
};

export default PartyBoardRenderer;