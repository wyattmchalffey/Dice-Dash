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

    // --- REWORKED: Main function to generate the new board layout ---
    generateBoard(playerCount = 4) {
        console.log(`Generating Mario Party-style Magical Kingdom board for ${playerCount} players`);

        const { width, height } = this.theme.boardSize;
        let spaces = [];

        // Step 1: Create the main looping path and identify junction points
        const { mainPath, junctions } = this.generateMainPath(width, height);

        // Step 2: Create the branching path that connects the junctions
        const branchPath = this.generateBranchPath(mainPath, junctions);

        // Combine all spaces into one array
        spaces = [...mainPath, ...branchPath];

        // Step 3: Connect all spaces using the new, structured logic
        this.connectSpaces(mainPath, branchPath, junctions);

        // Step 4: Generate all other board features using the complete set of spaces
        const starLocations = this.generateStarLocations(spaces);
        const landmarks = this.generateMagicalLandmarks(width, height);
        const specialEffects = this.generateSpecialEffects(width, height);

        console.log(`Generated board with ${spaces.length} spaces`);

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

    // --- NEW: Generates a simple, organic oval path and defines junction points ---
    generateMainPath(width, height) {
        const mainPath = [];
        const junctions = {};
        const numSpaces = 40;
        const centerX = width / 2;
        const centerY = height / 2;
        const radiusX = width * 0.4;
        const radiusY = height * 0.3;

        for (let i = 0; i < numSpaces; i++) {
            const angle = (i / numSpaces) * Math.PI * 2;
            const x = centerX + radiusX * Math.cos(angle) + Math.sin(angle * 3) * 1.5;
            const y = centerY + radiusY * Math.sin(angle) + Math.cos(angle * 4) * 1.5;

            // Define where the path will split and merge
            if (i === Math.floor(numSpaces * 0.25)) {
                junctions.startId = i;
            }
            if (i === Math.floor(numSpaces * 0.75)) {
                junctions.endId = i;
            }

            const spaceType = this.getSpaceTypeForPosition(i, numSpaces);

            mainPath.push({
                id: i,
                x: Math.round(x),
                y: Math.round(y),
                type: spaceType,
                pathType: 'main',
                connections: [],
                pathIndex: i,
                isJunction: i === junctions.startId || i === junctions.endId
            });
        }

        // Store the actual space objects for easier access later
        junctions.startSpace = mainPath[junctions.startId];
        junctions.endSpace = mainPath[junctions.endId];

        return { mainPath, junctions };
    }

    // --- NEW: Generates a single, clean branching path to connect the junctions ---
    generateBranchPath(mainPath, junctions) {
        const branchPath = [];
        const numBranchSpaces = 12;
        let spaceId = mainPath.length; // Start IDs after the main path

        const { startSpace, endSpace } = junctions;

        // Position the branch loop relative to the junction points (placing it "above")
        const centerX = (startSpace.x + endSpace.x) / 2;
        const centerY = (startSpace.y + endSpace.y) / 2 - 15; // Shift upwards
        const radiusX = Math.abs(startSpace.x - endSpace.x) / 2 + 5;
        const radiusY = 8;

        for (let i = 0; i < numBranchSpaces; i++) {
            const angle = Math.PI + (i / (numBranchSpaces - 1)) * Math.PI;
            const x = centerX + radiusX * Math.cos(angle);
            const y = centerY + radiusY * Math.sin(angle);

            let spaceType = 'BLUE';
            if (i === Math.floor(numBranchSpaces / 2)) spaceType = 'STAR';
            else if (i % 3 === 0) spaceType = 'GREEN';

            branchPath.push({
                id: spaceId++,
                x: Math.round(x),
                y: Math.round(y),
                type: spaceType,
                pathType: 'branch',
                connections: [],
                pathIndex: i
            });
        }

        return branchPath;
    }

    // --- NEW: A cleaner, more deliberate way to connect the paths ---
    connectSpaces(mainPath, branchPath, junctions) {
        // 1. Connect the main path spaces in a continuous loop
        for (let i = 0; i < mainPath.length; i++) {
            const currentSpace = mainPath[i];
            const nextSpace = mainPath[(i + 1) % mainPath.length];
            currentSpace.connections.push(nextSpace.id);
        }

        // 2. Connect the branch path spaces sequentially
        for (let i = 0; i < branchPath.length - 1; i++) {
            const currentSpace = branchPath[i];
            const nextSpace = branchPath[i + 1];
            currentSpace.connections.push(nextSpace.id);
        }

        // 3. Create the split path at the starting junction
        const startJunction = junctions.startSpace;
        const branchStart = branchPath[0];
        // The junction now also connects to the start of the branch path
        startJunction.connections.push(branchStart.id);

        // 4. Create the merge point at the ending junction
        const endJunction = junctions.endSpace;
        const branchEnd = branchPath[branchPath.length - 1];
        // The end of the branch path now connects to the ending junction
        branchEnd.connections.push(endJunction.id);
    }

    // --- Helper Functions (Copied from your original class) ---

    getSpaceTypeForPosition(position, totalSpaces) {
        if (position === 0) return 'BLUE';
        if (position === Math.floor(totalSpaces * 0.25) || position === Math.floor(totalSpaces * 0.75)) return 'STAR';
        if (position === Math.floor(totalSpaces * 0.33) || position === Math.floor(totalSpaces * 0.66)) return 'SHOP';

        const distribution = Math.random();
        if (distribution < 0.40) return 'BLUE';
        else if (distribution < 0.60) return 'RED';
        else if (distribution < 0.75) return 'GREEN';
        else if (distribution < 0.85) return 'HAPPENING';
        else if (distribution < 0.95) return 'CHANCE';
        else return 'BLUE';
    }

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

    generateMagicalLandmarks(width, height) {
        const landmarks = [];
        const centerX = width / 2;
        const centerY = height / 2;

        landmarks.push({ id: 'crystal_palace', x: centerX, y: centerY, type: 'castle', name: 'Crystal Palace', size: 'large', model: 'crystal_palace_3d', animations: ['flag_wave', 'crystal_shimmer', 'window_glow'], interactive: true, description: 'The heart of the Magical Kingdom' });
        landmarks.push({ id: 'wizard_tower', x: centerX - 15, y: centerY - 12, type: 'tower', name: 'Wizard\'s Tower', size: 'medium', model: 'wizard_tower_3d', animations: ['magic_swirl', 'window_light', 'star_orbit'], interactive: true, description: 'Home to ancient magical knowledge' });
        landmarks.push({ id: 'dream_fountain', x: centerX + 15, y: centerY + 10, type: 'fountain', name: 'Fountain of Dreams', size: 'medium', model: 'magical_fountain_3d', animations: ['water_flow', 'rainbow_mist', 'coin_splash'], interactive: true, description: 'Make a wish and see it come true' });

        const enchantedElements = [{ x: 10, y: 25, type: 'tree', name: 'Ancient Oak', size: 'small' }, { x: 50, y: 20, type: 'crystal', name: 'Power Crystal', size: 'small' }, { x: 30, y: 40, type: 'portal', name: 'Mystery Portal', size: 'small' }, { x: 45, y: 35, type: 'statue', name: 'Hero Statue', size: 'small' }];
        enchantedElements.forEach((element, index) => {
            landmarks.push({ id: `enchanted_${element.type}_${index}`, x: element.x, y: element.y, type: element.type, name: element.name, size: element.size, model: `${element.type}_model`, animations: [this.getElementAnimation(element.type)], decorative: true });
        });
        return landmarks;
    }

    getElementAnimation(type) {
        const animations = { 'tree': 'sway_leaves', 'crystal': 'pulse_glow', 'portal': 'swirl_energy', 'statue': 'ambient_glow' };
        return animations[type] || 'gentle_float';
    }

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

    generateSpecialEffects(width, height) {
        return [
            { id: 'aurora_effect', type: 'aurora', area: { x: 0, y: 0, width: width, height: height * 0.3 }, colors: ['#8b5cf6', '#3b82f6', '#10b981'], animation: 'wave_flow', layer: 'background' },
            { id: 'floating_islands', type: 'floating_element', positions: [{ x: 15, y: 15 }, { x: width - 15, y: 20 }, { x: 20, y: height - 15 }], animation: 'gentle_bob', layer: 'midground' },
            { id: 'magical_particles', type: 'particle_system', emitters: [{ x: width / 2, y: height / 2, rate: 5, type: 'star' }, { x: 10, y: 10, rate: 3, type: 'sparkle' }, { x: width - 10, y: height - 10, rate: 3, type: 'sparkle' }], layer: 'foreground' }
        ];
    }
}