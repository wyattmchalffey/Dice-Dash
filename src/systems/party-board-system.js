// src/systems/party-board-system.js
// Enhanced party-style board system with classic Mario Party feel (no branding)

export const PARTY_SPACE_TYPES = {
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
    VILLAIN: {
        id: 'VILLAIN',
        name: 'Villain Space',
        color: '#7c2d12',
        textColor: '#ffffff',
        description: 'The villain causes trouble!',
        animation: 'fire',
        sound: 'villain_laugh',
        icon: '👿'
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
    MINIGAME: {
        id: 'MINIGAME',
        name: 'Mini-Game Space',
        color: '#ec4899',
        textColor: '#ffffff',
        description: 'Play a mini-game!',
        animation: 'game_controller',
        sound: 'minigame_start',
        icon: '🎮'
    },
    SHOP: {
        id: 'SHOP',
        name: 'Item Shop',
        color: '#06b6d4',
        textColor: '#ffffff',
        description: 'Buy helpful items',
        animation: 'shopping_bag',
        sound: 'shop_bell',
        icon: '🛍️'
    },
    WARP: {
        id: 'WARP',
        name: 'Warp Space',
        color: '#10b981',
        textColor: '#ffffff',
        description: 'Warp to another location',
        animation: 'portal_swirl',
        sound: 'warp_pipe',
        icon: '🌀'
    },
    BANK: {
        id: 'BANK',
        name: 'Bank Space',
        color: '#059669',
        textColor: '#ffffff',
        description: 'Collect or deposit coins',
        animation: 'bank_vault',
        sound: 'bank_deposit',
        icon: '🏦'
    }
};

export const PARTY_BOARD_THEMES = {
    CRYSTAL_CASTLE: {
        id: 'crystal_castle',
        name: 'Crystal Castle',
        description: 'A magical adventure through a shimmering crystal palace',
        backgroundColor: '#fdf2f8',
        pathColor: '#f9a8d4',
        decorativeColor: '#ec4899',
        unlockLevel: 1,
        boardSize: { width: 120, height: 80 },
        pathStyle: 'crystal_pathway',
        specialFeatures: ['crystal_towers', 'magic_gardens', 'throne_room'],
        ambientEffects: ['floating_sparkles', 'magical_chimes', 'crystal_reflections'],
        backgroundPattern: 'crystal_formations',
        lighting: 'prismatic_glow'
    },
    VOLCANIC_FORTRESS: {
        id: 'volcanic_fortress',
        name: 'Volcanic Fortress',
        description: 'Navigate the dangerous halls of a fiery volcanic castle',
        backgroundColor: '#1f1611',
        pathColor: '#dc2626',
        decorativeColor: '#f59e0b',
        unlockLevel: 5,
        boardSize: { width: 140, height: 90 },
        pathStyle: 'lava_rock',
        specialFeatures: ['lava_pits', 'flame_jets', 'dragon_statues'],
        ambientEffects: ['lava_bubbles', 'fire_particles', 'ominous_shadows'],
        backgroundPattern: 'volcanic_rock',
        lighting: 'fire_glow'
    },
    RACING_CIRCUIT: {
        id: 'racing_circuit',
        name: 'Grand Prix Circuit',
        description: 'Race around a colorful championship racing track',
        backgroundColor: '#dcfce7',
        pathColor: '#4ade80',
        decorativeColor: '#16a34a',
        unlockLevel: 10,
        boardSize: { width: 160, height: 100 },
        pathStyle: 'racing_track',
        specialFeatures: ['finish_line', 'pit_stops', 'boost_pads'],
        ambientEffects: ['racing_flags', 'engine_sounds', 'cheering_crowd'],
        backgroundPattern: 'checkered_pattern',
        lighting: 'bright_stadium'
    },
    OCEAN_DEPTHS: {
        id: 'ocean_depths',
        name: 'Ocean Depths',
        description: 'Dive deep into an underwater adventure kingdom',
        backgroundColor: '#0c4a6e',
        pathColor: '#0ea5e9',
        decorativeColor: '#06b6d4',
        unlockLevel: 15,
        boardSize: { width: 180, height: 110 },
        pathStyle: 'coral_reef',
        specialFeatures: ['bubble_streams', 'underwater_caves', 'sea_creatures'],
        ambientEffects: ['floating_bubbles', 'water_currents', 'fish_schools'],
        backgroundPattern: 'ocean_waves',
        lighting: 'underwater_blue'
    },
    COSMIC_STATION: {
        id: 'cosmic_station',
        name: 'Cosmic Station',
        description: 'Journey through the cosmos in a space adventure',
        backgroundColor: '#0f0825',
        pathColor: '#6366f1',
        decorativeColor: '#a855f7',
        unlockLevel: 20,
        boardSize: { width: 200, height: 120 },
        pathStyle: 'starlight_trail',
        specialFeatures: ['gravity_wells', 'launch_stars', 'black_holes'],
        ambientEffects: ['twinkling_stars', 'galaxy_spiral', 'cosmic_dust'],
        backgroundPattern: 'starfield',
        lighting: 'cosmic_glow'
    }
};

export class PartyBoardGenerator {
    constructor(theme = PARTY_BOARD_THEMES.CRYSTAL_CASTLE) {
        this.theme = theme;
        this.spaceTypes = Object.values(PARTY_SPACE_TYPES);
    }

    // Generate a large party-style board
    generatePartyBoard(playerCount = 200) {
        console.log(`Generating party board: ${this.theme.name} for ${playerCount} players`);

        const { width, height } = this.theme.boardSize;
        const spaces = [];
        const starLocations = [];
        const landmarks = [];

        // Create the main circular path (classic party game style)
        const mainPath = this.generateMainPath(width, height);
        spaces.push(...mainPath);

        // Create branch paths for more complex navigation
        const branches = this.generateBranchPaths(width, height, mainPath.length);
        spaces.push(...branches);

        // Add special landmark spaces
        const specialLandmarks = this.generateLandmarks(width, height);
        landmarks.push(...specialLandmarks);

        // Place star locations strategically
        const stars = this.generateStarLocations(spaces);
        starLocations.push(...stars);

        // Connect all spaces properly
        this.connectSpaces(spaces);

        // Add theme-specific decorations
        const decorations = this.generateThemeDecorations(width, height);

        console.log(`Generated board with ${spaces.length} spaces, ${starLocations.length} star locations`);

        return {
            id: `party_${this.theme.id}`,
            name: this.theme.name,
            theme: this.theme,
            spaces,
            starLocations,
            landmarks,
            decorations,
            width,
            height,
            maxPlayers: playerCount,
            spawnZones: this.generateSpawnZones(spaces),
            specialAreas: this.generateSpecialAreas(width, height)
        };
    }

    // Generate the main circular path like classic party game boards
    generateMainPath(width, height) {
        const spaces = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const mainRadius = Math.min(width, height) * 0.35;
        const numMainSpaces = 60; // Main loop spaces

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

    // Determine space type for main path (classic party game distribution)
    getSpaceTypeForMainPath(position, totalSpaces) {
        // Start space is always blue
        if (position === 0) return 'BLUE';
        
        // Star spaces every 15 positions
        if (position % 15 === 0 && position > 0) return 'STAR';
        
        // Mini-game spaces every 10 positions
        if (position % 10 === 0 && position > 0) return 'MINIGAME';
        
        // Shop spaces every 12 positions
        if (position % 12 === 0 && position > 0) return 'SHOP';
        
        // Chance spaces every 20 positions
        if (position % 20 === 0 && position > 0) return 'CHANCE';
        
        // Villain spaces every 25 positions
        if (position % 25 === 0 && position > 0) return 'VILLAIN';
        
        // Warp spaces every 18 positions
        if (position % 18 === 0 && position > 0) return 'WARP';
        
        // Random distribution for remaining spaces
        const rand = Math.random();
        if (rand < 0.45) return 'BLUE';   // 45% blue spaces
        if (rand < 0.70) return 'RED';    // 25% red spaces
        if (rand < 0.85) return 'GREEN';  // 15% event spaces
        return 'BLUE';                    // Default to blue
    }

    // Generate branch paths that connect to main path
    generateBranchPaths(width, height, mainPathLength) {
        const branches = [];
        const numBranches = 4; // Four major branches
        let spaceId = mainPathLength;

        for (let b = 0; b < numBranches; b++) {
            const branchLength = 12 + Math.floor(Math.random() * 8); // 12-20 spaces per branch
            const connectionPoint = Math.floor((mainPathLength / numBranches) * b) + 5;
            
            // Create branch path extending from main path
            const branchAngle = (b * 90 + 45) * (Math.PI / 180); // 45°, 135°, 225°, 315°
            const centerX = width / 2;
            const centerY = height / 2;
            
            for (let i = 0; i < branchLength; i++) {
                const distance = 15 + (i * 4); // Spiral outward
                const currentAngle = branchAngle + (i * 0.3); // Slight curve
                const x = centerX + Math.cos(currentAngle) * distance;
                const y = centerY + Math.sin(currentAngle) * distance;
                
                // Ensure space is within bounds
                if (x >= 5 && x < width - 5 && y >= 5 && y < height - 5) {
                    const spaceType = this.getSpaceTypeForBranch(i, branchLength);
                    
                    branches.push({
                        id: spaceId++,
                        x: Math.round(x),
                        y: Math.round(y),
                        type: spaceType,
                        pathType: 'branch',
                        branchId: b,
                        branchIndex: i,
                        connectionPoint: connectionPoint,
                        connections: [],
                        decorations: this.getSpaceDecorations(spaceType),
                        special: this.getBranchSpecialProperties(spaceType, b, i)
                    });
                }
            }
        }

        return branches;
    }

    // Space type distribution for branch paths
    getSpaceTypeForBranch(position, branchLength) {
        // End of branch is always special
        if (position === branchLength - 1) {
            const specialTypes = ['STAR', 'SHOP', 'BANK'];
            return specialTypes[Math.floor(Math.random() * specialTypes.length)];
        }
        
        // Middle of branch has more interesting spaces
        if (position > branchLength * 0.3 && position < branchLength * 0.7) {
            const rand = Math.random();
            if (rand < 0.3) return 'GREEN';
            if (rand < 0.5) return 'MINIGAME';
            if (rand < 0.7) return 'BLUE';
            return 'RED';
        }
        
        // Default distribution
        const rand = Math.random();
        if (rand < 0.5) return 'BLUE';
        if (rand < 0.8) return 'RED';
        return 'GREEN';
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

    // Generate theme-specific landmarks
    generateLandmarks(width, height) {
        const landmarks = [];
        const centerX = width / 2;
        const centerY = height / 2;

        // Central landmark based on theme
        landmarks.push({
            id: 'central_landmark',
            x: centerX,
            y: centerY,
            type: 'main_structure',
            name: this.getCentralLandmarkName(),
            size: 'large',
            decorative: true
        });

        // Corner landmarks
        const corners = [
            { x: width * 0.1, y: height * 0.1 },
            { x: width * 0.9, y: height * 0.1 },
            { x: width * 0.1, y: height * 0.9 },
            { x: width * 0.9, y: height * 0.9 }
        ];

        corners.forEach((corner, index) => {
            landmarks.push({
                id: `corner_landmark_${index}`,
                x: corner.x,
                y: corner.y,
                type: 'corner_structure',
                name: this.getCornerLandmarkName(index),
                size: 'medium',
                decorative: true
            });
        });

        return landmarks;
    }

    // Get central landmark name based on theme
    getCentralLandmarkName() {
        const themeNames = {
            crystal_castle: 'Crystal Throne',
            volcanic_fortress: 'Lava Crater',
            racing_circuit: 'Victory Podium',
            ocean_depths: 'Coral Palace',
            cosmic_station: 'Command Center'
        };
        return themeNames[this.theme.id] || 'Central Plaza';
    }

    // Get corner landmark names
    getCornerLandmarkName(index) {
        const themeCorners = {
            crystal_castle: ['North Tower', 'East Garden', 'South Gate', 'West Spire'],
            volcanic_fortress: ['Fire Pit', 'Molten Falls', 'Ash Fields', 'Ember Peak'],
            racing_circuit: ['Start Line', 'Turn 1', 'Pit Stop', 'Finish Line'],
            ocean_depths: ['Kelp Forest', 'Tide Pools', 'Deep Trench', 'Coral Gardens'],
            cosmic_station: ['Solar Array', 'Docking Bay', 'Observatory', 'Engine Room']
        };
        return themeCorners[this.theme.id]?.[index] || `Corner ${index + 1}`;
    }

    // Connect spaces in a party game style
    connectSpaces(spaces) {
        // Connect main path spaces in order
        const mainPathSpaces = spaces.filter(space => space.pathType === 'main');
        for (let i = 0; i < mainPathSpaces.length; i++) {
            const current = mainPathSpaces[i];
            const next = mainPathSpaces[(i + 1) % mainPathSpaces.length];
            current.connections.push(next.id);
        }

        // Connect branch paths
        const branchSpaces = spaces.filter(space => space.pathType === 'branch');
        const branchGroups = this.groupBy(branchSpaces, 'branchId');

        Object.values(branchGroups).forEach(branch => {
            // Connect branch spaces in order
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

    // Utility function to group array by property
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
    }

    // Generate spawn zones for players
    generateSpawnZones(spaces) {
        const startSpace = spaces.find(space => space.pathType === 'main' && space.pathIndex === 0);
        return startSpace ? [{ x: startSpace.x, y: startSpace.y, spaceId: startSpace.id }] : [];
    }

    // Generate special themed areas
    generateSpecialAreas(width, height) {
        return {
            centralArea: {
                x: width / 2,
                y: height / 2,
                radius: 10,
                type: 'central_plaza'
            },
            outerRing: {
                centerX: width / 2,
                centerY: height / 2,
                innerRadius: Math.min(width, height) * 0.4,
                outerRadius: Math.min(width, height) * 0.45,
                type: 'decoration_zone'
            }
        };
    }

    // Get space decorations based on type
    getSpaceDecorations(spaceType) {
        const decorations = {
            BLUE: ['coin_sparkle', 'blue_glow'],
            RED: ['warning_glow', 'red_particles'],
            GREEN: ['question_mark', 'green_sparkle'],
            STAR: ['star_glow', 'golden_particles'],
            MINIGAME: ['controller_icon', 'game_glow'],
            SHOP: ['shop_sign', 'item_display'],
            WARP: ['portal_effect', 'swirl_animation'],
            BANK: ['coin_stack', 'vault_glow'],
            VILLAIN: ['dark_aura', 'menacing_glow'],
            CHANCE: ['spinning_wheel', 'rainbow_glow']
        };
        return decorations[spaceType] || ['basic_glow'];
    }

    // Get special properties for spaces
    getSpecialProperties(spaceType, position) {
        const properties = {};
        
        if (spaceType === 'WARP') {
            properties.warpDestinations = this.getWarpDestinations(position);
        }
        
        if (spaceType === 'STAR') {
            properties.starRotation = true;
            properties.nextStarLocation = this.getNextStarLocation(position);
        }
        
        if (spaceType === 'CHANCE') {
            properties.chanceEvents = this.getChanceEvents();
        }
        
        return properties;
    }

    // Get branch-specific special properties
    getBranchSpecialProperties(spaceType, branchId, position) {
        const properties = this.getSpecialProperties(spaceType, position);
        properties.branchId = branchId;
        properties.isDeadEnd = position === 0; // First space of branch connects back
        return properties;
    }

    // Get warp destinations
    getWarpDestinations(currentPosition) {
        // Warp to other warp spaces
        return ['random_warp', 'start_space', 'star_space'];
    }

    // Get next star location for star rotation
    getNextStarLocation(currentStarPosition) {
        // Logic for where star moves after being purchased
        return null; // Will be determined at runtime
    }

    // Get possible chance events
    getChanceEvents() {
        return [
            'swap_positions',
            'steal_coins',
            'teleport_random',
            'gain_star',
            'lose_star',
            'coin_shower',
            'reverse_direction',
            'warp_to_start'
        ];
    }

    // Generate theme decorations
    generateThemeDecorations(width, height) {
        const decorations = [];
        const numDecorations = 20 + Math.floor(Math.random() * 15);

        for (let i = 0; i < numDecorations; i++) {
            decorations.push({
                id: `decoration_${i}`,
                x: Math.random() * width,
                y: Math.random() * height,
                type: this.getRandomDecorationType(),
                size: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
                rotation: Math.random() * 360,
                opacity: Math.random() * 0.3 + 0.7 // 0.7 to 1.0
            });
        }

        return decorations;
    }

    // Get random decoration type based on theme
    getRandomDecorationType() {
        const themeDecorations = {
            crystal_castle: ['crystal_shard', 'magic_sparkle', 'royal_banner', 'gem_cluster'],
            volcanic_fortress: ['lava_rock', 'fire_ember', 'skull_decoration', 'molten_stream'],
            racing_circuit: ['tire_stack', 'racing_flag', 'cone_marker', 'finish_banner'],
            ocean_depths: ['seaweed', 'bubble_cluster', 'coral_formation', 'starfish'],
            cosmic_station: ['asteroid', 'star_cluster', 'space_debris', 'energy_field']
        };
        
        const decorations = themeDecorations[this.theme.id] || ['generic_decoration'];
        return decorations[Math.floor(Math.random() * decorations.length)];
    }
}