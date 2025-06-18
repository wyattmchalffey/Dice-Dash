// src/components/MassiveBoard.js
import React, { useState, useEffect, useRef } from 'react';
import { BoardGenerator } from '../../utils/board-generator';
import { EnergyService } from '../../services/energy-service';
import { 
  Star, Coins, Zap, MapPin, Castle, Gem, Map, Plus, Minus,
  Navigation, Users, Eye, EyeOff, Compass, Timer
} from 'lucide-react';

const boardGenerator = new BoardGenerator();
const energyService = new EnergyService();

export function MassiveBoard({ game, user, currentPlayer, onMove }) {
  const [board, setBoard] = useState(null);
  const [viewCenter, setViewCenter] = useState({ x: 25, y: 25 });
  const [zoom, setZoom] = useState(1);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [visiblePlayers, setVisiblePlayers] = useState([]);
  const [energyTimer, setEnergyTimer] = useState(null);
  
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);

  useEffect(() => {
    // Generate or load the massive board
    if (!board) {
      const newBoard = boardGenerator.generateMassiveBoard(50, 50, 0.6);
      setBoard(newBoard);
      
      // Center on player position
      const playerSpace = newBoard.spaces.find(s => s.id === currentPlayer.position);
      if (playerSpace) {
        setViewCenter({ x: playerSpace.x, y: playerSpace.y });
      }
    }
  }, [board, currentPlayer.position]);

  useEffect(() => {
    // Update energy timer
    const interval = setInterval(() => {
      const timeUntilNext = energyService.getTimeUntilNextEnergy(currentPlayer);
      setEnergyTimer(energyService.formatTimeRemaining(timeUntilNext));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayer]);

  useEffect(() => {
    // Draw the board
    if (!board || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cellSize = 40 * zoom;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate visible region
    const viewRadius = 10 / zoom;
    const visibleSpaces = boardGenerator.getVisibleBoard(
      board.spaces, 
      viewCenter.x, 
      viewCenter.y, 
      viewRadius
    );

    // Draw grid background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw biome backgrounds
    const biomeColors = {
      0: 'rgba(34, 197, 94, 0.1)', // Grasslands
      1: 'rgba(251, 191, 36, 0.1)', // Desert
      2: 'rgba(59, 130, 246, 0.1)', // Ice Fields
      3: 'rgba(239, 68, 68, 0.1)', // Volcano
      4: 'rgba(147, 51, 234, 0.1)' // Crystal Caves
    };

    // Group spaces by biome for efficient rendering
    const spacesByBiome = {};
    visibleSpaces.forEach(space => {
      if (!spacesByBiome[space.biome]) {
        spacesByBiome[space.biome] = [];
      }
      spacesByBiome[space.biome].push(space);
    });

    // Draw biome regions
    Object.entries(spacesByBiome).forEach(([biome, spaces]) => {
      ctx.fillStyle = biomeColors[biome] || 'rgba(255, 255, 255, 0.05)';
      spaces.forEach(space => {
        const screenX = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
        const screenY = (space.y - viewCenter.y) * cellSize + canvas.height / 2;
        ctx.fillRect(screenX - cellSize/2, screenY - cellSize/2, cellSize, cellSize);
      });
    });

    // Draw connections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2 * zoom;
    visibleSpaces.forEach(space => {
      const screenX1 = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
      const screenY1 = (space.y - viewCenter.y) * cellSize + canvas.height / 2;
      
      space.connections.forEach(connectionId => {
        const connectedSpace = board.spaces.find(s => s.id === connectionId);
        if (connectedSpace && visibleSpaces.includes(connectedSpace)) {
          const screenX2 = (connectedSpace.x - viewCenter.x) * cellSize + canvas.width / 2;
          const screenY2 = (connectedSpace.y - viewCenter.y) * cellSize + canvas.height / 2;
          
          ctx.beginPath();
          ctx.moveTo(screenX1, screenY1);
          ctx.lineTo(screenX2, screenY2);
          ctx.stroke();
        }
      });
    });

    // Draw spaces
    visibleSpaces.forEach(space => {
      const screenX = (space.x - viewCenter.x) * cellSize + canvas.width / 2;
      const screenY = (space.y - viewCenter.y) * cellSize + canvas.height / 2;
      
      // Space color based on type
      const spaceColors = {
        blue: '#3b82f6',
        red: '#ef4444',
        star: '#fbbf24',
        shop: '#10b981',
        event: '#8b5cf6',
        chance: '#f97316',
        landmark: '#ec4899'
      };
      
      ctx.fillStyle = spaceColors[space.type] || '#6b7280';
      ctx.beginPath();
      ctx.arc(screenX, screenY, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw landmark icons
      if (space.landmark) {
        ctx.font = `${16 * zoom}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = {
          castle: '🏰',
          temple: '⛩️',
          market: '🏪',
          lair: '🐉',
          portal: '🌀',
          vault: '💎'
        };
        ctx.fillText(icons[space.landmark.type] || '📍', screenX, screenY);
      }
    });

    // Draw players
    const allPlayers = game.players.filter(player => {
      const playerSpace = board.spaces.find(s => s.id === player.position);
      return playerSpace && visibleSpaces.includes(playerSpace);
    });
    
    setVisiblePlayers(allPlayers);
    
    allPlayers.forEach((player, index) => {
      const playerSpace = board.spaces.find(s => s.id === player.position);
      if (!playerSpace) return;
      
      const screenX = (playerSpace.x - viewCenter.x) * cellSize + canvas.width / 2;
      const screenY = (playerSpace.y - viewCenter.y) * cellSize + canvas.height / 2;
      
      // Player token
      const offset = index * 10;
      ctx.fillStyle = player.color.replace('bg-', '#').replace('500', '');
      ctx.beginPath();
      ctx.arc(screenX + offset, screenY + offset, cellSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Player initial
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${12 * zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name[0], screenX + offset, screenY + offset);
      
      // Current player indicator
      if (player.userId === user.uid) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX + offset, screenY + offset, cellSize * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

  }, [board, viewCenter, zoom, game.players, user.uid]);

  useEffect(() => {
    // Draw minimap
    if (!board || !minimapRef.current || !showMinimap) return;

    const canvas = minimapRef.current;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / board.width;
    
    // Clear minimap
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all spaces as dots
    ctx.fillStyle = '#4a5568';
    board.spaces.forEach(space => {
      ctx.fillRect(space.x * scale, space.y * scale, 2, 2);
    });
    
    // Draw current view area
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    const viewSize = 20 * scale / zoom;
    ctx.strokeRect(
      (viewCenter.x - 10 / zoom) * scale,
      (viewCenter.y - 10 / zoom) * scale,
      viewSize,
      viewSize
    );
    
    // Draw player positions
    game.players.forEach(player => {
      const playerSpace = board.spaces.find(s => s.id === player.position);
      if (playerSpace) {
        ctx.fillStyle = player.userId === user.uid ? '#fbbf24' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(playerSpace.x * scale, playerSpace.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [board, viewCenter, zoom, showMinimap, game.players, user.uid]);

  const handleCanvasClick = (e) => {
    if (!board) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellSize = 40 * zoom;
    const worldX = Math.round((x - canvas.width / 2) / cellSize + viewCenter.x);
    const worldY = Math.round((y - canvas.height / 2) / cellSize + viewCenter.y);
    
    const clickedSpace = board.spaces.find(s => s.x === worldX && s.y === worldY);
    if (clickedSpace) {
      setSelectedSpace(clickedSpace);
    }
  };

  const handleMinimapClick = (e) => {
    if (!board) return;
    
    const canvas = minimapRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scale = canvas.width / board.width;
    const worldX = x / scale;
    const worldY = y / scale;
    
    setViewCenter({ x: worldX, y: worldY });
  };

  const moveView = (dx, dy) => {
    setViewCenter(prev => ({
      x: Math.max(0, Math.min(board.width - 1, prev.x + dx)),
      y: Math.max(0, Math.min(board.height - 1, prev.y + dy))
    }));
  };

  const adjustZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const centerOnPlayer = () => {
    const playerSpace = board.spaces.find(s => s.id === currentPlayer.position);
    if (playerSpace) {
      setViewCenter({ x: playerSpace.x, y: playerSpace.y });
    }
  };

  const getSpaceTypeIcon = (type) => {
    switch(type) {
      case 'star': return <Star className="w-4 h-4" />;
      case 'shop': return <Coins className="w-4 h-4" />;
      case 'event': return <Zap className="w-4 h-4" />;
      case 'chance': return <Gem className="w-4 h-4" />;
      case 'landmark': return <Castle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
      />

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* View Controls */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              onClick={() => moveView(0, -1)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
            >
              ↑
            </button>
            <div />
            <button
              onClick={() => moveView(-1, 0)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
            >
              ←
            </button>
            <button
              onClick={centerOnPlayer}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveView(1, 0)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
            >
              →
            </button>
            <div />
            <button
              onClick={() => moveView(0, 1)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
            >
              ↓
            </button>
            <div />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
          <button
            onClick={() => adjustZoom(-0.1)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => adjustZoom(0.1)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Minimap Toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className="bg-black/80 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-gray-800"
        >
          {showMinimap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Player Status */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-10 h-10 rounded-full ${currentPlayer.color} flex items-center justify-center font-bold`}>
            {currentPlayer.name[0]}
          </div>
          <div>
            <div className="font-semibold">{currentPlayer.name}</div>
            <div className="text-sm text-gray-300">Position: Space {currentPlayer.position}</div>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-400" />
              Coins
            </span>
            <span>{currentPlayer.coins}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              Stars
            </span>
            <span>{currentPlayer.stars}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-blue-400" />
              Energy
            </span>
            <span>{Math.floor(currentPlayer.energy)}/{currentPlayer.maxEnergy}</span>
          </div>
          {currentPlayer.energy < currentPlayer.maxEnergy && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Timer className="w-3 h-3" />
              Next energy: {energyTimer}
            </div>
          )}
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-white text-xs mb-1 flex items-center gap-1">
            <Map className="w-3 h-3" />
            World Map
          </div>
          <canvas
            ref={minimapRef}
            width={150}
            height={150}
            className="border border-gray-600 cursor-pointer"
            onClick={handleMinimapClick}
          />
        </div>
      )}

      {/* Visible Players List */}
      {visiblePlayers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Nearby Players ({visiblePlayers.length})
          </div>
          <div className="space-y-1">
            {visiblePlayers.map(player => (
              <div key={player.userId} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full ${player.color}`} />
                <span>{player.name}</span>
                {player.isOnline ? (
                  <span className="text-green-400">●</span>
                ) : (
                  <span className="text-gray-500">●</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Space Info */}
      {selectedSpace && (
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              {getSpaceTypeIcon(selectedSpace.type)}
              {selectedSpace.name}
            </h3>
            <button
              onClick={() => setSelectedSpace(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="text-sm space-y-1 text-gray-300">
            <p>Coordinates: ({selectedSpace.x}, {selectedSpace.y})</p>
            <p>Type: {selectedSpace.type}</p>
            {selectedSpace.biome !== null && (
              <p>Biome: {board.biomes[selectedSpace.biome].name}</p>
            )}
            {selectedSpace.landmark && (
              <p className="text-yellow-400">Landmark: {selectedSpace.landmark.name}</p>
            )}
            <p>Connections: {selectedSpace.connections.length}</p>
          </div>

          {/* Path to selected space */}
          {selectedSpace.id !== currentPlayer.position && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <button
                onClick={() => {
                  const path = boardGenerator.findPath(
                    board.spaces,
                    currentPlayer.position,
                    selectedSpace.id
                  );
                  console.log('Path to destination:', path);
                }}
                className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
              >
                <Compass className="w-3 h-3 inline mr-1" />
                Find Path ({Math.abs(selectedSpace.x - viewCenter.x) + Math.abs(selectedSpace.y - viewCenter.y)} spaces)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}