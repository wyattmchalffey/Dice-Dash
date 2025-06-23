// src/systems/board-system.js
// Single beautiful board theme - Magical Kingdom

// Enhanced space types with better visuals
export const SPACE_TYPES = {
    BLUE: {
        id: 'BLUE',
        name: 'Coin Space',
        color: '#3b82f6',
        textColor: '#ffffff',
        description: 'Gain 3 coins',
        animation: 'coin_sparkle',
        sound: 'coin_collect',
        icon: '💰',
        gradient: ['#60a5fa', '#3b82f6', '#2563eb']
    },
    RED: {
        id: 'RED',
        name: 'Penalty Space',
        color: '#ef4444',
        textColor: '#ffffff',
        description: 'Lose 3 coins',
        animation: 'penalty_shake',
        sound: 'coin_lose',
        icon: '💸',
        gradient: ['#f87171', '#ef4444', '#dc2626']
    },
    GREEN: {
        id: 'GREEN',
        name: 'Event Space',
        color: '#10b981',
        textColor: '#ffffff',
        description: 'Random event occurs',
        animation: 'event_pulse',
        sound: 'event_trigger',
        icon: '🎲',
        gradient: ['#34d399', '#10b981', '#059669']
    },
    HAPPENING: {
        id: 'HAPPENING',
        name: 'Mini-Game Space',
        color: '#06b6d4',
        textColor: '#ffffff',
        description: 'Start a mini-game',
        animation: 'sparkle',
        sound: 'happening',
        icon: '🎮',
        gradient: ['#67e8f9', '#06b6d4', '#0891b2']
    },
    STAR: {
        id: 'STAR',
        name: 'Star Space',
        color: '#fbbf24',
        textColor: '#000000',
        description: 'Buy a star for 20 coins',
        animation: 'star_twinkle',
        sound: 'star_appear',
        icon: '⭐',
        gradient: ['#fde047', '#fbbf24', '#f59e0b'],
        special: true
    },
    CHANCE: {
        id: 'CHANCE',
        name: 'Chance Space',
        color: '#8b5cf6',
        textColor: '#ffffff',
        description: 'Spin the wheel of chance!',
        animation: 'chance_wheel',
        sound: 'chance_time',
        icon: '🎰',
        gradient: ['#a78bfa', '#8b5cf6', '#7c3aed']
    },
    SHOP: {
        id: 'SHOP',
        name: 'Shop Space',
        color: '#ec4899',
        textColor: '#ffffff',
        description: 'Buy items and power-ups',
        animation: 'shop_sparkle',
        sound: 'shop_jingle',
        icon: '🏪',
        gradient: ['#f9a8d4', '#ec4899', '#db2777']
    },
    WARP: {
        id: 'WARP',
        name: 'Warp Space',
        color: '#14b8a6',
        textColor: '#ffffff',
        description: 'Teleport to another warp space',
        animation: 'warp_portal',
        sound: 'warp_sound',
        icon: '🌀',
        gradient: ['#5eead4', '#14b8a6', '#0d9488']
    }
};

// Single magical kingdom theme with enhanced visuals
export const BOARD_THEMES = {
    MAGICAL_KINGDOM: {
        id: 'magical_kingdom',
        name: 'Magical Kingdom',
        description: 'A fantastical realm of wonder and adventure',
        backgroundColor: '#0f172a',
        pathColor: '#fbbf24',
        decorativeColor: '#8b5cf6',
        boardSize: { width: 60, height: 50 }, // Perfect size for visual appeal
        pathStyle: 'golden_path',
        specialFeatures: [
            'floating_islands',
            'crystal_towers',
            'magic_fountains',
            'enchanted_forests',
            'rainbow_bridges'
        ],
        ambientEffects: [
            'floating_sparkles',
            'magical_mist',
            'aurora_lights',
            'shooting_stars'
        ],
        backgroundPattern: 'starry_night',
        lighting: 'magical_glow',
        unlockLevel: 1,
        landmarks: [
            {
                type: 'castle',
                name: 'Crystal Palace',
                description: 'The majestic center of the magical kingdom'
            },
            {
                type: 'tower',
                name: 'Wizard\'s Tower',
                description: 'Ancient tower of mystical knowledge'
            },
            {
                type: 'fountain',
                name: 'Fountain of Dreams',
                description: 'Grants wishes to those pure of heart'
            }
        ]
    }
};

export class BoardGenerator {
    constructor(theme = BOARD_THEMES.MAGICAL_KINGDOM) {
        this.theme = theme;
        this.spaceTypes = Object.values(SPACE_TYPES);
    }

    // Generate the magical kingdom board
    generateBoard(playerCount = 4) {
        console.log(`Generating Magical Kingdom board for ${playerCount} players`);

        const { width, height } = this.theme.boardSize;
        const spaces = [];
        const starLocations = [];
        const landmarks = [];
        const specialEffects = [];

        // Create main circular path with interesting shape
        const mainPath = this.generateMagicalPath(width, height);
        spaces.push(...mainPath);

        // Add branching paths to create more interesting gameplay
        const branches = this.generateBranchPaths(width, height, mainPath.length);
        spaces.push(...branches);

        // Add secret passages
        const secrets = this.generateSecretPaths(width, height, spaces.length);
        spaces.push(...secrets);

        // Generate beautiful landmarks
        const mainLandmarks = this.generateMagicalLandmarks(width, height);
        landmarks.push(...mainLandmarks);

        // Place star locations strategically
        const stars = this.generateStarLocations(spaces);
        starLocations.push(...stars);

        // Add special visual effects locations
        const effects = this.generateSpecialEffects(width, height);
        specialEffects.push(...effects);

        // Connect all spaces
        this.connectSpaces(spaces);

        console.log(`Generated magical board with ${spaces.length} spaces`);

        return {
            id: 'magical_kingdom',
            name: this.theme.name,
            theme: this.theme,
            spaces,
            starLocations,
            landmarks,
            specialEffects,
            width,
            height,
            maxPlayers: 8,
            metadata: {
                difficulty: 'medium',
                estimatedPlayTime: '45-60 minutes',
                features: this.theme.specialFeatures
            }
        };
    }

    // Generate the main magical path in an interesting shape
    generateMagicalPath(width, height) {
        const spaces = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const mainPathSpaces = 40; // Main loop size
        
        // Create a figure-8 or infinity symbol shape for visual interest
        for (let i = 0; i < mainPathSpaces; i++) {
            const angle = (i / mainPathSpaces) * Math.PI * 2;
            const t = i / mainPathSpaces;
            
            // Figure-8 parametric equations with some variation
            const scale = 18;
            const x = centerX + scale * Math.sin(angle) * (1 + 0.3 * Math.cos(angle * 2));
            const y = centerY + scale * 0.6 * Math.sin(angle * 2);
            
            // Add some organic variation
            const xOffset = Math.sin(i * 0.5) * 2;
            const yOffset = Math.cos(i * 0.7) * 2;
            
            const spaceType = this.getSpaceTypeForPosition(i, mainPathSpaces);
            
            spaces.push({
                id: i,
                x: Math.round(x + xOffset),
                y: Math.round(y + yOffset),
                type: spaceType,
                pathType: 'main',
                connections: [],
                pathIndex: i,
                decorations: this.getSpaceDecorations(spaceType),
                effects: this.getSpaceEffects(spaceType)
            });
        }
        
        return spaces;
    }

    // Generate branching paths for more strategic choices
    generateBranchPaths(width, height, startId) {
        const branches = [];
        const numBranches = 3; // Three branch paths for variety
        let spaceId = startId;

        const branchConfigs = [
            { start: 8, length: 8, direction: 'upper', theme: 'crystal' },
            { start: 18, length: 6, direction: 'lower', theme: 'forest' },
            { start: 30, length: 10, direction: 'outer', theme: 'clouds' }
        ];

        branchConfigs.forEach((config, branchIndex) => {
            const connectionPoint = config.start;
            const branchLength = config.length;
            
            for (let i = 0; i < branchLength; i++) {
                const progress = i / (branchLength - 1);
                let x, y;
                
                if (config.direction === 'upper') {
                    x = width/2 + (i - branchLength/2) * 4;
                    y = height/2 - 15 - i * 2;
                } else if (config.direction === 'lower') {
                    x = width/2 - (i - branchLength/2) * 4;
                    y = height/2 + 15 + i * 1.5;
                } else {
                    const angle = Math.PI * 0.3 * branchIndex;
                    x = width/2 + Math.cos(angle) * (20 + i * 3);
                    y = height/2 + Math.sin(angle) * (20 + i * 2);
                }
                
                // Special space types for branches
                let spaceType = 'BLUE';
                if (i === branchLength - 1) spaceType = 'STAR';
                else if (i === Math.floor(branchLength / 2)) spaceType = 'SHOP';
                else if (Math.random() < 0.3) spaceType = 'CHANCE';
                else if (Math.random() < 0.5) spaceType = 'GREEN';
                
                branches.push({
                    id: spaceId++,
                    x: Math.round(x),
                    y: Math.round(y),
                    type: spaceType,
                    pathType: 'branch',
                    branchId: branchIndex,
                    branchTheme: config.theme,
                    connections: [],
                    pathIndex: i,
                    connectionPoint: connectionPoint,
                    decorations: this.getBranchDecorations(config.theme),
                    effects: this.getBranchEffects(config.theme)
                });
            }
        });

        return branches;
    }

    // Generate secret warp paths
    generateSecretPaths(width, height, startId) {
        const secrets = [];
        let spaceId = startId;
        
        // Add warp spaces in corners for strategic teleportation
        const warpLocations = [
            { x: 10, y: 10, partner: 1 },
            { x: width - 10, y: 10, partner: 0 },
            { x: 10, y: height - 10, partner: 3 },
            { x: width - 10, y: height - 10, partner: 2 }
        ];
        
        warpLocations.forEach((loc, index) => {
            secrets.push({
                id: spaceId++,
                x: loc.x,
                y: loc.y,
                type: 'WARP',
                pathType: 'secret',
                connections: [],
                warpPartner: startId + loc.partner,
                decorations: ['portal_effect', 'swirling_energy'],
                effects: ['portal_particles', 'dimensional_ripple']
            });
        });
        
        return secrets;
    }

    // Get space type based on position for balanced distribution
    getSpaceTypeForPosition(position, totalSpaces) {
        // Start space is always blue
        if (position === 0) return 'BLUE';
        
        // Star spaces at strategic positions
        if (position === Math.floor(totalSpaces * 0.25) || 
            position === Math.floor(totalSpaces * 0.75)) {
            return 'STAR';
        }
        
        // Shop spaces at quarter positions
        if (position === Math.floor(totalSpaces * 0.33) || 
            position === Math.floor(totalSpaces * 0.66)) {
            return 'SHOP';
        }
        
        // Distributed space types
        const distribution = Math.random();
        if (distribution < 0.40) return 'BLUE';      // 40% blue
        else if (distribution < 0.60) return 'RED';   // 20% red
        else if (distribution < 0.75) return 'GREEN'; // 15% green
        else if (distribution < 0.85) return 'HAPPENING'; // 10% mini-game
        else if (distribution < 0.95) return 'CHANCE';    // 10% chance
        else return 'BLUE'; // 5% fallback to blue
    }

    // Get decorations for spaces
    getSpaceDecorations(spaceType) {
        const decorations = {
            'STAR': ['golden_sparkles', 'star_constellation', 'celestial_glow'],
            'SHOP': ['merchant_tent', 'item_display', 'welcome_sign'],
            'CHANCE': ['spinning_wheel', 'fortune_cards', 'mystic_orb'],
            'WARP': ['portal_frame', 'energy_swirl', 'dimensional_anchor'],
            'GREEN': ['event_banner', 'surprise_box', 'question_marks'],
            'HAPPENING': ['game_controller', 'competition_flag', 'spotlight']
        };
        
        return decorations[spaceType] || ['basic_decoration'];
    }

    // Get special effects for spaces
    getSpaceEffects(spaceType) {
        const effects = {
            'STAR': { particles: 'golden_dust', animation: 'rotate_slow', glow: true },
            'SHOP': { particles: 'coins', animation: 'bob_up_down', glow: false },
            'CHANCE': { particles: 'magic_swirl', animation: 'spin', glow: true },
            'WARP': { particles: 'dimensional_rift', animation: 'vortex', glow: true },
            'GREEN': { particles: 'question_bubbles', animation: 'pulse', glow: false },
            'HAPPENING': { particles: 'confetti', animation: 'bounce', glow: true }
        };
        
        return effects[spaceType] || { particles: 'sparkle', animation: 'none', glow: false };
    }

    // Get decorations for branch themes
    getBranchDecorations(theme) {
        const decorations = {
            'crystal': ['crystal_formations', 'glowing_gems', 'prismatic_light'],
            'forest': ['enchanted_trees', 'fairy_lights', 'mushroom_circles'],
            'clouds': ['fluffy_clouds', 'rainbow_wisps', 'floating_platforms']
        };
        
        return decorations[theme] || ['magical_decoration'];
    }

    // Get effects for branch themes
    getBranchEffects(theme) {
        const effects = {
            'crystal': { ambience: 'crystal_chimes', particles: 'crystal_shards' },
            'forest': { ambience: 'forest_whispers', particles: 'fireflies' },
            'clouds': { ambience: 'wind_current', particles: 'cloud_puffs' }
        };
        
        return effects[theme] || { ambience: 'magical_hum', particles: 'sparkles' };
    }

    // Generate magical landmarks
    generateMagicalLandmarks(width, height) {
        const landmarks = [];
        const centerX = width / 2;
        const centerY = height / 2;

        // Crystal Palace at center
        landmarks.push({
            id: 'crystal_palace',
            x: centerX,
            y: centerY,
            type: 'castle',
            name: 'Crystal Palace',
            size: 'large',
            model: 'crystal_palace_3d',
            animations: ['flag_wave', 'crystal_shimmer', 'window_glow'],
            interactive: true,
            description: 'The heart of the Magical Kingdom'
        });

        // Wizard's Tower
        landmarks.push({
            id: 'wizard_tower',
            x: centerX - 15,
            y: centerY - 12,
            type: 'tower',
            name: 'Wizard\'s Tower',
            size: 'medium',
            model: 'wizard_tower_3d',
            animations: ['magic_swirl', 'window_light', 'star_orbit'],
            interactive: true,
            description: 'Home to ancient magical knowledge'
        });

        // Fountain of Dreams
        landmarks.push({
            id: 'dream_fountain',
            x: centerX + 15,
            y: centerY + 10,
            type: 'fountain',
            name: 'Fountain of Dreams',
            size: 'medium',
            model: 'magical_fountain_3d',
            animations: ['water_flow', 'rainbow_mist', 'coin_splash'],
            interactive: true,
            description: 'Make a wish and see it come true'
        });

        // Enchanted elements
        const enchantedElements = [
            { x: 10, y: 25, type: 'tree', name: 'Ancient Oak', size: 'small' },
            { x: 50, y: 20, type: 'crystal', name: 'Power Crystal', size: 'small' },
            { x: 30, y: 40, type: 'portal', name: 'Mystery Portal', size: 'small' },
            { x: 45, y: 35, type: 'statue', name: 'Hero Statue', size: 'small' }
        ];

        enchantedElements.forEach((element, index) => {
            landmarks.push({
                id: `enchanted_${element.type}_${index}`,
                x: element.x,
                y: element.y,
                type: element.type,
                name: element.name,
                size: element.size,
                model: `${element.type}_model`,
                animations: [this.getElementAnimation(element.type)],
                decorative: true
            });
        });

        return landmarks;
    }

    // Get animations for different element types
    getElementAnimation(type) {
        const animations = {
            'tree': 'sway_leaves',
            'crystal': 'pulse_glow',
            'portal': 'swirl_energy',
            'statue': 'ambient_glow'
        };
        
        return animations[type] || 'gentle_float';
    }

    // Generate star locations
    generateStarLocations(spaces) {
        const starSpaces = spaces.filter(space => space.type === 'STAR');
        return starSpaces.map((space, index) => ({
            id: `star_${index}`,
            spaceId: space.id,
            x: space.x,
            y: space.y,
            active: true,
            cost: 20,
            rotationOrder: index,
            currentHolder: null,
            specialEffect: 'star_beacon'
        }));
    }

    // Generate special visual effects
    generateSpecialEffects(width, height) {
        return [
            {
                id: 'aurora_effect',
                type: 'aurora',
                area: { x: 0, y: 0, width: width, height: height * 0.3 },
                colors: ['#8b5cf6', '#3b82f6', '#10b981'],
                animation: 'wave_flow',
                layer: 'background'
            },
            {
                id: 'floating_islands',
                type: 'floating_element',
                positions: [
                    { x: 15, y: 15 },
                    { x: width - 15, y: 20 },
                    { x: 20, y: height - 15 }
                ],
                animation: 'gentle_bob',
                layer: 'midground'
            },
            {
                id: 'magical_particles',
                type: 'particle_system',
                emitters: [
                    { x: width/2, y: height/2, rate: 5, type: 'star' },
                    { x: 10, y: 10, rate: 3, type: 'sparkle' },
                    { x: width-10, y: height-10, rate: 3, type: 'sparkle' }
                ],
                layer: 'foreground'
            }
        ];
    }

    // Connect spaces with intelligent pathfinding
    connectSpaces(spaces) {
        // Connect main path in a loop
        const mainPathSpaces = spaces.filter(s => s.pathType === 'main')
                                    .sort((a, b) => a.pathIndex - b.pathIndex);
        
        for (let i = 0; i < mainPathSpaces.length; i++) {
            const current = mainPathSpaces[i];
            const next = mainPathSpaces[(i + 1) % mainPathSpaces.length];
            current.connections.push(next.id);
        }

        // Connect branches
        const branchGroups = this.groupBy(spaces.filter(s => s.pathType === 'branch'), 'branchId');
        
        Object.values(branchGroups).forEach(branch => {
            branch.sort((a, b) => a.pathIndex - b.pathIndex);
            
            // Connect branch spaces
            for (let i = 0; i < branch.length - 1; i++) {
                branch[i].connections.push(branch[i + 1].id);
                branch[i + 1].connections.push(branch[i].id);
            }
            
            // Connect to main path
            if (branch.length > 0) {
                const connectionPoint = branch[0].connectionPoint;
                const mainSpace = mainPathSpaces[connectionPoint];
                if (mainSpace) {
                    mainSpace.connections.push(branch[0].id);
                    branch[0].connections.push(mainSpace.id);
                    
                    // Connect branch end back to main path
                    const endConnection = (connectionPoint + 5) % mainPathSpaces.length;
                    const endMainSpace = mainPathSpaces[endConnection];
                    if (endMainSpace && branch[branch.length - 1]) {
                        branch[branch.length - 1].connections.push(endMainSpace.id);
                    }
                }
            }
        });

        // Connect warp spaces
        const warpSpaces = spaces.filter(s => s.type === 'WARP');
        warpSpaces.forEach(warp => {
            if (warp.warpPartner !== undefined) {
                const partner = spaces.find(s => s.id === warp.warpPartner);
                if (partner) {
                    warp.connections.push(partner.id);
                }
            }
        });
    }

    // Helper function
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    // Generate spawn zones
    generateSpawnZones(spaces) {
        const startSpace = spaces.find(s => s.pathType === 'main' && s.pathIndex === 0);
        return startSpace ? [{
            id: 'main_spawn',
            spaceId: startSpace.id,
            x: startSpace.x,
            y: startSpace.y,
            capacity: 8,
            type: 'default'
        }] : [];
    }
}