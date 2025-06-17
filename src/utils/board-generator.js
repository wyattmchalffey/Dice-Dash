// src/utils/board-generator.js

export class BoardGenerator {
  constructor() {
    this.spaceTypes = [
      { type: 'blue', weight: 40, name: 'Blue Space', effect: 'Gain 3 coins' },
      { type: 'red', weight: 25, name: 'Red Space', effect: 'Lose 3 coins' },
      { type: 'event', weight: 15, name: 'Event Space', effect: 'Random event' },
      { type: 'shop', weight: 10, name: 'Item Shop', effect: 'Buy items' },
      { type: 'chance', weight: 5, name: 'Chance Space', effect: 'Draw chance card' },
      { type: 'star', weight: 5, name: 'Star Space', effect: 'Buy star for 20 coins' }
    ];

    this.biomes = [
      { 
        name: 'Grasslands', 
        color: 'from-green-600 to-green-700',
        spaceModifiers: { blue: 1.2, red: 0.8 }
      },
      { 
        name: 'Desert', 
        color: 'from-yellow-600 to-orange-600',
        spaceModifiers: { red: 1.5, shop: 0.5 }
      },
      { 
        name: 'Ice Fields', 
        color: 'from-blue-300 to-blue-500',
        spaceModifiers: { event: 1.5, blue: 0.7 }
      },
      { 
        name: 'Volcano', 
        color: 'from-red-600 to-orange-700',
        spaceModifiers: { red: 2.0, star: 1.5 }
      },
      { 
        name: 'Crystal Caves', 
        color: 'from-purple-600 to-pink-600',
        spaceModifiers: { chance: 2.0, shop: 1.5 }
      }
    ];
  }

  // Generate a massive interconnected board
  generateMassiveBoard(width = 50, height = 50, density = 0.7) {
    const spaces = [];
    const grid = Array(height).fill(null).map(() => Array(width).fill(null));
    let idCounter = 0;

    // Generate main paths
    const mainPaths = this.generateMainPaths(width, height);
    
    // Place spaces along main paths
    mainPaths.forEach(path => {
      path.forEach(coord => {
        if (!grid[coord.y][coord.x]) {
          const space = this.createSpace(idCounter++, coord.x, coord.y);
          spaces.push(space);
          grid[coord.y][coord.x] = space;
        }
      });
    });

    // Add random spaces for density
    const targetSpaces = Math.floor(width * height * density);
    while (spaces.length < targetSpaces) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      if (!grid[y][x] && this.hasNearbySpace(grid, x, y)) {
        const space = this.createSpace(idCounter++, x, y);
        spaces.push(space);
        grid[y][x] = space;
      }
    }

    // Connect spaces
    this.connectSpaces(spaces, grid);

    // Add biome information
    this.assignBiomes(spaces, width, height);

    // Place special landmarks
    this.placeLandmarks(spaces, grid);

    return { spaces, width, height, biomes: this.biomes };
  }

  generateMainPaths(width, height) {
    const paths = [];
    
    // Create several main highways across the board
    // Horizontal main path
    const horizontalPath = [];
    const midY = Math.floor(height / 2);
    for (let x = 0; x < width; x++) {
      horizontalPath.push({ x, y: midY + Math.sin(x * 0.1) * 3 });
    }
    paths.push(horizontalPath);

    // Vertical main path
    const verticalPath = [];
    const midX = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
      verticalPath.push({ x: midX + Math.sin(y * 0.1) * 3, y });
    }
    paths.push(verticalPath);

    // Diagonal paths
    const diagonal1 = [];
    for (let i = 0; i < Math.min(width, height); i++) {
      diagonal1.push({ x: i, y: i });
    }
    paths.push(diagonal1);

    const diagonal2 = [];
    for (let i = 0; i < Math.min(width, height); i++) {
      diagonal2.push({ x: width - 1 - i, y: i });
    }
    paths.push(diagonal2);

    // Circular path in center
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const circular = [];
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      circular.push({
        x: Math.floor(centerX + Math.cos(angle) * radius),
        y: Math.floor(centerY + Math.sin(angle) * radius)
      });
    }
    paths.push(circular);

    return paths.map(path => 
      path.filter(coord => 
        coord.x >= 0 && coord.x < width && 
        coord.y >= 0 && coord.y < height
      )
    );
  }

  createSpace(id, x, y) {
    const spaceType = this.selectSpaceType();
    return {
      id,
      x,
      y,
      type: spaceType.type,
      name: `${spaceType.name} ${id}`,
      connections: [],
      biome: null,
      landmark: null
    };
  }

  selectSpaceType() {
    const totalWeight = this.spaceTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const spaceType of this.spaceTypes) {
      random -= spaceType.weight;
      if (random <= 0) {
        return spaceType;
      }
    }
    
    return this.spaceTypes[0];
  }

  hasNearbySpace(grid, x, y) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    return directions.some(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx >= 0 && nx < grid[0].length && 
             ny >= 0 && ny < grid.length && 
             grid[ny][nx] !== null;
    });
  }

  connectSpaces(spaces, grid) {
    const height = grid.length;
    const width = grid[0].length;

    spaces.forEach(space => {
      const connections = [];
      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
      ];

      directions.forEach(([dx, dy]) => {
        const nx = space.x + dx;
        const ny = space.y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx]) {
          const neighbor = grid[ny][nx];
          
          // Prefer cardinal connections, diagonal with lower probability
          const isDiagonal = Math.abs(dx) + Math.abs(dy) === 2;
          if (!isDiagonal || Math.random() < 0.3) {
            connections.push(neighbor.id);
          }
        }
      });

      space.connections = connections;
    });
  }

  assignBiomes(spaces, width, height) {
    // Create biome regions using Voronoi-like approach
    const biomeSeeds = this.biomes.map((biome, index) => ({
      ...biome,
      x: Math.random() * width,
      y: Math.random() * height,
      index
    }));

    spaces.forEach(space => {
      // Find closest biome seed
      let closestBiome = biomeSeeds[0];
      let minDistance = Infinity;

      biomeSeeds.forEach(seed => {
        const distance = Math.sqrt(
          Math.pow(space.x - seed.x, 2) + 
          Math.pow(space.y - seed.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestBiome = seed;
        }
      });

      space.biome = closestBiome.index;
      
      // Apply biome modifiers to space type
      const biome = this.biomes[closestBiome.index];
      if (biome.spaceModifiers[space.type]) {
        // Potentially change space type based on biome
        if (Math.random() < 0.3) { // 30% chance to apply biome effect
          const modifier = biome.spaceModifiers[space.type];
          if (modifier < 1 && Math.random() > modifier) {
            // Change to a different space type
            space.type = 'blue'; // Default fallback
          }
        }
      }
    });
  }

  placeLandmarks(spaces, grid) {
    const landmarks = [
      { name: 'Grand Castle', type: 'castle', rarity: 1 },
      { name: 'Ancient Temple', type: 'temple', rarity: 3 },
      { name: 'Market Square', type: 'market', rarity: 5 },
      { name: 'Dragon\'s Lair', type: 'lair', rarity: 2 },
      { name: 'Mystic Portal', type: 'portal', rarity: 2 },
      { name: 'Treasure Vault', type: 'vault', rarity: 4 }
    ];

    landmarks.forEach(landmark => {
      for (let i = 0; i < landmark.rarity; i++) {
        const space = spaces[Math.floor(Math.random() * spaces.length)];
        if (!space.landmark) {
          space.landmark = landmark;
          space.type = 'landmark';
          space.name = landmark.name;
        }
      }
    });
  }

  // Get visible portion of the board for rendering
  getVisibleBoard(spaces, centerX, centerY, viewRadius = 10) {
    return spaces.filter(space => {
      const distance = Math.sqrt(
        Math.pow(space.x - centerX, 2) + 
        Math.pow(space.y - centerY, 2)
      );
      return distance <= viewRadius;
    });
  }

  // Find shortest path between two spaces (for AI or guidance)
  findPath(spaces, startId, endId) {
    const spaceMap = new Map(spaces.map(s => [s.id, s]));
    const start = spaceMap.get(startId);
    const end = spaceMap.get(endId);
    
    if (!start || !end) return [];

    const visited = new Set();
    const queue = [{ space: start, path: [start.id] }];
    
    while (queue.length > 0) {
      const { space, path } = queue.shift();
      
      if (space.id === endId) {
        return path;
      }
      
      if (visited.has(space.id)) continue;
      visited.add(space.id);
      
      space.connections.forEach(connectionId => {
        const nextSpace = spaceMap.get(connectionId);
        if (nextSpace && !visited.has(connectionId)) {
          queue.push({
            space: nextSpace,
            path: [...path, connectionId]
          });
        }
      });
    }
    
    return [];
  }
}