// src/systems/board-system.js
// Refactored standard Mario Party-style board system

export const SPACE_TYPES = {
    BLUE: {
        id: 'BLUE',
        name: 'Blue Space',
        color: '#3b82f6',
        textColor: '#ffffff',
        coinEffect: 3,
        description: 'Gain 3 coins',
        animation: 'coin_gain',
        sound: 'coins_positive',
        icon: '💰'
    },
    RED: {
        id: 'RED', 
        name: 'Red Space',
        color: '#dc2626',
        textColor: '#ffffff',
        coinEffect: -3,
        description: 'Lose 3 coins',
        animation: 'coin_loss',
        sound: 'coins_negative',
        icon: '💸'
    },
    GREEN: {
        id: 'GREEN',
        name: 'Event Space',
        color: '#16a34a',
        textColor: '#ffffff',
        description: 'Something happens!',
        animation: 'sparkle',
        sound: 'happening',
        icon: '❓'
    },
    STAR: {
        id: 'STAR',
        name: 'Star Space',
        color: '#fbbf24',
        textColor: '#000000',
        description: 'Buy a star for 20 coins',
        animation: 'star_twinkle',
        sound: 'star_appear',
        icon: '⭐'
    },
    CHANCE: {
        id: 'CHANCE',
        name: 'Chance Space',
        color: '#8b5cf6',
        textColor: '#ffffff',
        description: 'Spin the wheel of chance!',
        animation: 'chance_wheel',
        sound: 'chance_time',
        icon: '🎲'
    },
    SHOP: {
        id: 'SHOP',
        name: 'Shop Space',
        color: '#f59e0b',
        textColor: '#ffffff',
        description: 'Buy items and power-ups',
        animation: 'shop_sparkle',
        sound: 'shop_jingle',
        icon: '🏪'
    }
};

// Board themes
export const BOARD_THEMES = {
    CLASSIC_PLAINS: {
        id: 'classic_plains',
        name: 'Classic Plains',
        description: 'A traditional grassy meadow board',
        backgroundColor: '#86efac',
        pathColor: '#fbbf24',
        decorativeColor: '#16a34a',
        boardSize: { width: 80, height: 60 },
        pathStyle: 'classic_path',
        specialFeatures: ['coin_blocks', 'pipe_warps'],
        ambientEffects: ['floating_clouds', 'grass_sway'],
        backgroundPattern: 'grass_texture',
        lighting: 'sunny_day',
        unlockLevel: 1  // Add this
    },
    CRYSTAL_CAVE: {
        id: 'crystal_cave',
        name: 'Crystal Cave',
        description: 'A mystical underground cavern',
        backgroundColor: '#1e293b',
        pathColor: '#38bdf8',
        decorativeColor: '#7c3aed',
        boardSize: { width: 80, height: 60 },
        pathStyle: 'crystal_path',
        specialFeatures: ['crystal_formations', 'glowing_pools'],
        ambientEffects: ['crystal_sparkles', 'echo_sounds'],
        backgroundPattern: 'rock_texture',
        lighting: 'crystal_glow',
        unlockLevel: 5  // Add this
    },
    BEACH_RESORT: {
        id: 'beach_resort',
        name: 'Beach Resort',
        description: 'A tropical paradise getaway',
        backgroundColor: '#fef3c7',
        pathColor: '#06b6d4',
        decorativeColor: '#f59e0b',
        boardSize: { width: 80, height: 60 },
        pathStyle: 'sand_path',
        specialFeatures: ['palm_trees', 'beach_umbrellas'],
        ambientEffects: ['wave_sounds', 'seagull_calls'],
        backgroundPattern: 'sand_texture',
        lighting: 'tropical_sun',
        unlockLevel: 10  // Add this
    }
};

export class BoardGenerator {
    constructor(theme = BOARD_THEMES.CLASSIC_PLAINS) {
        this.theme = theme;
        this.spaceTypes = Object.values(SPACE_TYPES);
    }

    // Generate a standard-sized party board (similar to Mario Party)
    generateBoard(playerCount = 4) {
        console.log(`Generating party board: ${this.theme.name} for ${playerCount} players`);

        const { width, height } = this.theme.boardSize;
        const spaces = [];
        const starLocations = [];
        const landmarks = [];

        // Create main path - much smaller and more focused
        const mainPath = this.generateMainPath(width, height);
        spaces.push(...mainPath);

        // Add 2-3 small branch paths
        const branches = this.generateBranchPaths(width, height, mainPath.length);
        spaces.push(...branches);

        // Add key landmarks
        const mainLandmarks = this.generateLandmarks(width, height);
        landmarks.push(...mainLandmarks);

        // Place star locations (fewer, more strategic)
        const stars = this.generateStarLocations(spaces);
        starLocations.push(...stars);

        // Connect all spaces
        this.connectSpaces(spaces);

        console.log(`Generated board with ${spaces.length} spaces`);

        return {
            id: `party_${this.theme.id}`,
            name: this.theme.name,
            theme: this.theme,
            spaces,
            starLocations,
            landmarks,
            width,
            height,
            maxPlayers: Math.min(playerCount, 8), // Standard party game limit
            spawnZones: this.generateSpawnZones(spaces),
            specialAreas: this.generateSpecialAreas(width, height)
        };
    }

    // Generate main circular path - standard size
    generateMainPath(width, height) {
        const spaces = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const mainRadius = Math.min(width, height) * 0.3; // Smaller radius
        const numMainSpaces = 24; // Standard board size - much smaller

        for (let i = 0; i < numMainSpaces; i++) {
            const angle = (i / numMainSpaces) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * mainRadius;
            const y = centerY + Math.sin(angle) * mainRadius;
            
            const spaceType = this.getSpaceTypeForMainPath(i, numMainSpaces);
            
            spaces.push({
                id: i,
                x: Math.round(x),
                y: Math.round(y),
                type: spaceType,
                pathType: 'main',
                connections: [],
                isMainPath: true,
                pathIndex: i,
                decorations: this.getSpaceDecorations(spaceType),
                special: this.getSpecialProperties(spaceType, i)
            });
        }

        return spaces;
    }

    // Standard space distribution for Mario Party-style boards
    getSpaceTypeForMainPath(position, totalSpaces) {
        // Start space is always blue
        if (position === 0) return 'BLUE';
        
        // Star space at opposite side of start
        if (position === Math.floor(totalSpaces / 2)) return 'STAR';
        
        // Shop spaces at quarter positions
        if (position === Math.floor(totalSpaces / 4) || position === Math.floor(3 * totalSpaces / 4)) {
            return 'SHOP';
        }
        
        // Chance spaces at strategic points
        if (position % 8 === 0 && position > 0) return 'CHANCE';
        
        // Random distribution for remaining spaces
        const rand = Math.random();
        if (rand < 0.50) return 'BLUE';   // 50% blue spaces
        if (rand < 0.75) return 'RED';    // 25% red spaces
        if (rand < 0.90) return 'GREEN';  // 15% event spaces
        return 'BLUE';                    // Default to blue
    }

    // Generate smaller branch paths
    generateBranchPaths(width, height, mainPathLength) {
        const branches = [];
        const numBranches = 2; // Only 2 small branches for standard boards
        let spaceId = mainPathLength;

        for (let b = 0; b < numBranches; b++) {
            const branchLength = 6; // Small branches - only 6 spaces each
            const connectionPoint = Math.floor((mainPathLength / numBranches) * b) + 3;
            
            // Create simple straight branch
            const branchAngle = (b * 180 + 90) * (Math.PI / 180); // 90° and 270°
            const centerX = width / 2;
            const centerY = height / 2;
            
            for (let i = 0; i < branchLength; i++) {
                const distance = 8 + (i * 3); // Shorter extension
                const x = centerX + Math.cos(branchAngle) * distance;
                const y = centerY + Math.sin(branchAngle) * distance;
                
                const spaceType = i === branchLength - 1 ? 'STAR' : 
                                 Math.random() < 0.6 ? 'BLUE' : 'RED';
                
                branches.push({
                    id: spaceId++,
                    x: Math.round(x),
                    y: Math.round(y),
                    type: spaceType,
                    pathType: 'branch',
                    branchId: b,
                    connections: [],
                    pathIndex: i,
                    connectionPoint: connectionPoint,
                    decorations: this.getSpaceDecorations(spaceType)
                });
            }
        }

        return branches;
    }

    // Connect spaces in standard party game style
    connectSpaces(spaces) {
        // Connect main path spaces in circular order
        const mainPathSpaces = spaces.filter(space => space.pathType === 'main')
                                    .sort((a, b) => a.pathIndex - b.pathIndex);
        
        for (let i = 0; i < mainPathSpaces.length; i++) {
            const current = mainPathSpaces[i];
            const next = mainPathSpaces[(i + 1) % mainPathSpaces.length];
            current.connections.push(next.id);
        }

        // Connect branch paths
        const branchSpaces = spaces.filter(space => space.pathType === 'branch');
        const branchGroups = this.groupBy(branchSpaces, 'branchId');

        Object.values(branchGroups).forEach(branch => {
            // Sort branch spaces by path index
            branch.sort((a, b) => a.pathIndex - b.pathIndex);
            
            // Connect branch spaces linearly
            for (let i = 0; i < branch.length - 1; i++) {
                branch[i].connections.push(branch[i + 1].id);
                branch[i + 1].connections.push(branch[i].id); // Bidirectional
            }

            // Connect first branch space to main path
            if (branch.length > 0) {
                const connectionPoint = branch[0].connectionPoint;
                const mainSpace = mainPathSpaces[connectionPoint];
                if (mainSpace) {
                    mainSpace.connections.push(branch[0].id);
                    branch[0].connections.push(mainSpace.id);
                }
            }
        });
    }

    // Generate strategic star locations
    generateStarLocations(spaces) {
        const starSpaces = spaces.filter(space => space.type === 'STAR');
        return starSpaces.map((space, index) => ({
            id: `star_${index}`,
            spaceId: space.id,
            x: space.x,
            y: space.y,
            active: true,
            cost: 20,
            rotationOrder: index
        }));
    }

    // Generate simple landmarks for standard boards
    generateLandmarks(width, height) {
        const landmarks = [];
        const centerX = width / 2;
        const centerY = height / 2;

        // Single central landmark
        landmarks.push({
            id: 'central_landmark',
            x: centerX,
            y: centerY,
            type: 'main_structure',
            name: this.getCentralLandmarkName(),
            size: 'medium',
            decorative: true
        });

        return landmarks;
    }

    // Get central landmark name based on theme
    getCentralLandmarkName() {
        const themeNames = {
            classic_plains: 'Town Center',
            crystal_cave: 'Crystal Heart',
            beach_resort: 'Beach Tower'
        };
        return themeNames[this.theme.id] || 'Central Plaza';
    }

    // Generate spawn zones
    generateSpawnZones(spaces) {
        const startSpace = spaces.find(space => space.pathType === 'main' && space.pathIndex === 0);
        return startSpace ? [{ 
            id: 'main_spawn', 
            spaceId: startSpace.id, 
            maxPlayers: 8,
            x: startSpace.x,
            y: startSpace.y 
        }] : [];
    }

    // Generate special areas for standard boards
    generateSpecialAreas(width, height) {
        return [
            {
                id: 'center_area',
                x: width / 2,
                y: height / 2,
                radius: 8,
                type: 'neutral_zone',
                name: 'Center Plaza'
            }
        ];
    }

    // Get space decorations based on type
    getSpaceDecorations(spaceType) {
        const decorations = {
            BLUE: ['coin_sparkle'],
            RED: ['warning_glow'],
            GREEN: ['question_marks'],
            STAR: ['star_particles'],
            CHANCE: ['dice_icons'],
            SHOP: ['item_display']
        };
        return decorations[spaceType] || [];
    }

    // Get special properties for spaces
    getSpecialProperties(spaceType, position) {
        const properties = {};
        
        if (spaceType === 'STAR') {
            properties.starCost = 20;
        }
        
        if (spaceType === 'SHOP') {
            properties.shopItems = ['mushroom', 'golden_pipe', 'dice_block'];
        }
        
        return properties;
    }

    // Utility function to group array by property
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
    }
}