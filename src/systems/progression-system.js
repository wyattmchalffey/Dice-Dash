// src/systems/progression-system.js
// Character progression, XP, levels, and skill trees for MMO Party Quest

export const SKILL_TREES = {
    DICE_MASTER: {
        id: 'dice_master',
        name: 'Dice Master',
        description: 'Enhance your dice rolling abilities',
        color: '#f59e0b',
        skills: {
            lucky_rolls: {
                id: 'lucky_rolls',
                name: 'Lucky Rolls',
                description: '+10% chance for higher dice rolls',
                maxLevel: 5,
                cost: [1, 2, 3, 5, 8],
                effects: { diceBonus: [0.1, 0.15, 0.2, 0.25, 0.3] }
            },
            double_dice: {
                id: 'double_dice',
                name: 'Double Dice',
                description: 'Chance to roll dice twice',
                maxLevel: 3,
                cost: [3, 6, 10],
                effects: { doubleDiceChance: [0.05, 0.1, 0.15] },
                requires: ['lucky_rolls']
            },
            dice_control: {
                id: 'dice_control',
                name: 'Dice Control',
                description: 'Choose your dice result once per game',
                maxLevel: 1,
                cost: [15],
                effects: { controlledRolls: [1] },
                requires: ['double_dice']
            }
        }
    },
    COIN_COLLECTOR: {
        id: 'coin_collector',
        name: 'Coin Collector',
        description: 'Maximize your coin earnings',
        color: '#10b981',
        skills: {
            coin_boost: {
                id: 'coin_boost',
                name: 'Coin Boost',
                description: '+1 coin from coin spaces',
                maxLevel: 5,
                cost: [1, 2, 3, 5, 8],
                effects: { coinBonus: [1, 1, 2, 2, 3] }
            },
            treasure_hunter: {
                id: 'treasure_hunter',
                name: 'Treasure Hunter',
                description: 'Find hidden treasures on spaces',
                maxLevel: 3,
                cost: [3, 6, 10],
                effects: { treasureChance: [0.1, 0.15, 0.2] },
                requires: ['coin_boost']
            },
            coin_magnet: {
                id: 'coin_magnet',
                name: 'Coin Magnet',
                description: 'Steal coins from nearby players',
                maxLevel: 2,
                cost: [12, 20],
                effects: { stealChance: [0.1, 0.2] },
                requires: ['treasure_hunter']
            }
        }
    },
    MINIGAME_CHAMPION: {
        id: 'minigame_champion',
        name: 'Mini-Game Champion',
        description: 'Excel at mini-game competitions',
        color: '#8b5cf6',
        skills: {
            quick_reflexes: {
                id: 'quick_reflexes',
                name: 'Quick Reflexes',
                description: '+10% score in skill-based mini-games',
                maxLevel: 5,
                cost: [1, 2, 3, 5, 8],
                effects: { skillGameBonus: [0.1, 0.15, 0.2, 0.25, 0.3] }
            },
            lucky_streak: {
                id: 'lucky_streak',
                name: 'Lucky Streak',
                description: '+15% score in luck-based mini-games',
                maxLevel: 3,
                cost: [3, 6, 10],
                effects: { luckGameBonus: [0.15, 0.25, 0.35] },
                requires: ['quick_reflexes']
            },
            champion_aura: {
                id: 'champion_aura',
                name: 'Champion Aura',
                description: 'Start mini-games with bonus points',
                maxLevel: 1,
                cost: [18],
                effects: { startingBonus: [50] },
                requires: ['lucky_streak']
            }
        }
    },
    ENERGY_EFFICIENT: {
        id: 'energy_efficient',
        name: 'Energy Efficient',
        description: 'Optimize energy usage and regeneration',
        color: '#06b6d4',
        skills: {
            energy_saver: {
                id: 'energy_saver',
                name: 'Energy Saver',
                description: '10% chance to not consume energy',
                maxLevel: 5,
                cost: [2, 4, 6, 9, 13],
                effects: { energySaveChance: [0.1, 0.15, 0.2, 0.25, 0.3] }
            },
            quick_recovery: {
                id: 'quick_recovery',
                name: 'Quick Recovery',
                description: 'Energy regenerates 2 minutes faster',
                maxLevel: 3,
                cost: [4, 8, 12],
                effects: { regenBonus: [2, 3, 5] }, // minutes
                requires: ['energy_saver']
            },
            energy_overflow: {
                id: 'energy_overflow',
                name: 'Energy Overflow',
                description: 'Maximum energy increased by 2',
                maxLevel: 1,
                cost: [20],
                effects: { maxEnergyBonus: [2] },
                requires: ['quick_recovery']
            }
        }
    }
};

export const ACHIEVEMENTS = {
    // Basic achievements
    FIRST_STEPS: {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first game',
        category: 'progression',
        rewards: { xp: 100, coins: 50 },
        condition: { type: 'games_completed', value: 1 }
    },
    COIN_COLLECTOR: {
        id: 'coin_collector_100',
        name: 'Coin Collector',
        description: 'Collect 100 coins',
        category: 'coins',
        rewards: { xp: 150, skillPoints: 1 },
        condition: { type: 'total_coins_earned', value: 100 }
    },
    STAR_SEEKER: {
        id: 'star_seeker',
        name: 'Star Seeker',
        description: 'Collect your first star',
        category: 'stars',
        rewards: { xp: 200, coins: 100 },
        condition: { type: 'stars_collected', value: 1 }
    },
    MINIGAME_VICTOR: {
        id: 'minigame_victor',
        name: 'Mini-Game Victor',
        description: 'Win 10 mini-games',
        category: 'minigames',
        rewards: { xp: 300, skillPoints: 2 },
        condition: { type: 'minigames_won', value: 10 }
    },
    SOCIAL_BUTTERFLY: {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 5 friends',
        category: 'social',
        rewards: { xp: 250, coins: 150 },
        condition: { type: 'friends_added', value: 5 }
    },

    // Advanced achievements
    DICE_MASTER: {
        id: 'dice_master_achievement',
        name: 'Dice Master',
        description: 'Roll a 6 ten times in a row',
        category: 'dice',
        rewards: { xp: 500, skillPoints: 3, title: 'Dice Master' },
        condition: { type: 'consecutive_sixes', value: 10 }
    },
    BOARD_EXPLORER: {
        id: 'board_explorer',
        name: 'Board Explorer',
        description: 'Visit every space type',
        category: 'exploration',
        rewards: { xp: 400, coins: 300 },
        condition: { type: 'unique_spaces_visited', value: 15 }
    },
    CHAMPION: {
        id: 'champion',
        name: 'Champion',
        description: 'Win 50 games',
        category: 'wins',
        rewards: { xp: 1000, skillPoints: 5, title: 'Champion' },
        condition: { type: 'games_won', value: 50 }
    }
};

export class ProgressionSystem {
    constructor() {
        this.playerData = new Map();
        this.xpTable = this.generateXPTable();
        this.loadPlayerData();
    }

    // Generate XP requirements for each level
    generateXPTable() {
        const table = [0]; // Level 0 requires 0 XP
        let baseXP = 100;
        
        for (let level = 1; level <= 100; level++) {
            const xpRequired = Math.floor(baseXP * Math.pow(1.15, level - 1));
            table.push(table[level - 1] + xpRequired);
        }
        
        return table;
    }

    // Get or create player progression data
    getPlayerData(playerId) {
        if (!this.playerData.has(playerId)) {
            this.playerData.set(playerId, {
                playerId,
                level: 1,
                xp: 0,
                skillPoints: 0,
                skills: new Map(),
                achievements: new Set(),
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    totalCoinsEarned: 0,
                    starsCollected: 0,
                    minigamesWon: 0,
                    friendsAdded: 0,
                    consecutiveSixes: 0,
                    uniqueSpacesVisited: new Set(),
                    totalPlayTime: 0
                },
                titles: [],
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });
        }
        
        return this.playerData.get(playerId);
    }

    // Add XP to player
    addXP(playerId, amount, source = 'unknown') {
        const player = this.getPlayerData(playerId);
        const oldLevel = player.level;
        
        player.xp += amount;
        player.lastUpdated = Date.now();
        
        // Check for level up
        const newLevel = this.calculateLevel(player.xp);
        if (newLevel > oldLevel) {
            this.handleLevelUp(playerId, oldLevel, newLevel);
        }
        
        // Log XP gain
        this.logXPGain(playerId, amount, source);
        
        this.savePlayerData(playerId);
        return { oldLevel, newLevel: player.level, xpGained: amount };
    }

    // Calculate level from XP
    calculateLevel(xp) {
        for (let level = this.xpTable.length - 1; level >= 0; level--) {
            if (xp >= this.xpTable[level]) {
                return level;
            }
        }
        return 0;
    }

    // Handle level up
    handleLevelUp(playerId, oldLevel, newLevel) {
        const player = this.getPlayerData(playerId);
        player.level = newLevel;
        
        // Calculate skill points gained
        const skillPointsGained = newLevel - oldLevel;
        player.skillPoints += skillPointsGained;
        
        // Dispatch level up event
        window.dispatchEvent(new CustomEvent('playerLevelUp', {
            detail: {
                playerId,
                oldLevel,
                newLevel,
                skillPointsGained,
                totalSkillPoints: player.skillPoints
            }
        }));
        
        console.log(`Player ${playerId} leveled up from ${oldLevel} to ${newLevel}!`);
    }

    // Get XP needed for next level
    getXPToNextLevel(playerId) {
        const player = this.getPlayerData(playerId);
        const currentLevel = player.level;
        
        if (currentLevel >= this.xpTable.length - 1) {
            return 0; // Max level reached
        }
        
        const nextLevelXP = this.xpTable[currentLevel + 1];
        return nextLevelXP - player.xp;
    }

    // Get XP progress percentage for current level
    getXPProgress(playerId) {
        const player = this.getPlayerData(playerId);
        const currentLevel = player.level;
        
        if (currentLevel >= this.xpTable.length - 1) {
            return 100; // Max level
        }
        
        const currentLevelXP = this.xpTable[currentLevel];
        const nextLevelXP = this.xpTable[currentLevel + 1];
        const progressXP = player.xp - currentLevelXP;
        const levelXPRange = nextLevelXP - currentLevelXP;
        
        return Math.floor((progressXP / levelXPRange) * 100);
    }

    // Learn or upgrade a skill
    learnSkill(playerId, treeId, skillId) {
        const player = this.getPlayerData(playerId);
        const skillTree = SKILL_TREES[treeId.toUpperCase()];
        
        if (!skillTree) {
            throw new Error(`Skill tree ${treeId} not found`);
        }
        
        const skill = skillTree.skills[skillId];
        if (!skill) {
            throw new Error(`Skill ${skillId} not found in tree ${treeId}`);
        }
        
        const skillKey = `${treeId}_${skillId}`;
        const currentLevel = player.skills.get(skillKey) || 0;
        
        // Check if can upgrade
        if (currentLevel >= skill.maxLevel) {
            throw new Error(`Skill ${skillId} is already at max level`);
        }
        
        const cost = skill.cost[currentLevel];
        if (player.skillPoints < cost) {
            throw new Error(`Not enough skill points. Need ${cost}, have ${player.skillPoints}`);
        }
        
        // Check prerequisites
        if (skill.requires && currentLevel === 0) {
            for (const requiredSkill of skill.requires) {
                const requiredKey = `${treeId}_${requiredSkill}`;
                if (!player.skills.has(requiredKey) || player.skills.get(requiredKey) === 0) {
                    throw new Error(`Required skill ${requiredSkill} not learned`);
                }
            }
        }
        
        // Learn/upgrade the skill
        player.skillPoints -= cost;
        player.skills.set(skillKey, currentLevel + 1);
        player.lastUpdated = Date.now();
        
        this.savePlayerData(playerId);
        
        // Dispatch skill learned event
        window.dispatchEvent(new CustomEvent('skillLearned', {
            detail: {
                playerId,
                treeId,
                skillId,
                newLevel: currentLevel + 1,
                cost
            }
        }));
        
        return currentLevel + 1;
    }

    // Get skill level
    getSkillLevel(playerId, treeId, skillId) {
        const player = this.getPlayerData(playerId);
        const skillKey = `${treeId}_${skillId}`;
        return player.skills.get(skillKey) || 0;
    }

    // Get all skills for a tree
    getSkillTree(playerId, treeId) {
        const player = this.getPlayerData(playerId);
        const skillTree = SKILL_TREES[treeId.toUpperCase()];
        
        if (!skillTree) return null;
        
        const result = {
            ...skillTree,
            skills: {}
        };
        
        Object.entries(skillTree.skills).forEach(([skillId, skill]) => {
            const skillKey = `${treeId}_${skillId}`;
            const currentLevel = player.skills.get(skillKey) || 0;
            const canUpgrade = this.canUpgradeSkill(playerId, treeId, skillId);
            
            result.skills[skillId] = {
                ...skill,
                currentLevel,
                canUpgrade,
                nextCost: currentLevel < skill.maxLevel ? skill.cost[currentLevel] : null
            };
        });
        
        return result;
    }

    // Check if skill can be upgraded
    canUpgradeSkill(playerId, treeId, skillId) {
        const player = this.getPlayerData(playerId);
        const skillTree = SKILL_TREES[treeId.toUpperCase()];
        const skill = skillTree?.skills[skillId];
        
        if (!skill) return false;
        
        const skillKey = `${treeId}_${skillId}`;
        const currentLevel = player.skills.get(skillKey) || 0;
        
        // Check max level
        if (currentLevel >= skill.maxLevel) return false;
        
        // Check skill points
        const cost = skill.cost[currentLevel];
        if (player.skillPoints < cost) return false;
        
        // Check prerequisites
        if (skill.requires && currentLevel === 0) {
            for (const requiredSkill of skill.requires) {
                const requiredKey = `${treeId}_${requiredSkill}`;
                if (!player.skills.has(requiredKey) || player.skills.get(requiredKey) === 0) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // Update player statistics
    updateStats(playerId, statUpdates) {
        const player = this.getPlayerData(playerId);
        
        Object.entries(statUpdates).forEach(([stat, value]) => {
            if (stat === 'uniqueSpacesVisited') {
                player.stats.uniqueSpacesVisited.add(value);
            } else {
                player.stats[stat] = (player.stats[stat] || 0) + value;
            }
        });
        
        player.lastUpdated = Date.now();
        
        // Check for achievement progress
        this.checkAchievements(playerId);
        
        this.savePlayerData(playerId);
    }

    // Check and unlock achievements
    checkAchievements(playerId) {
        const player = this.getPlayerData(playerId);
        const newAchievements = [];
        
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            if (player.achievements.has(achievement.id)) return; // Already unlocked
            
            if (this.checkAchievementCondition(player, achievement.condition)) {
                player.achievements.add(achievement.id);
                this.grantAchievementRewards(playerId, achievement);
                newAchievements.push(achievement);
            }
        });
        
        if (newAchievements.length > 0) {
            window.dispatchEvent(new CustomEvent('achievementsUnlocked', {
                detail: { playerId, achievements: newAchievements }
            }));
        }
        
        return newAchievements;
    }

    // Check if achievement condition is met
    checkAchievementCondition(player, condition) {
        const stats = player.stats;
        
        switch (condition.type) {
            case 'games_completed':
                return stats.gamesPlayed >= condition.value;
            case 'games_won':
                return stats.gamesWon >= condition.value;
            case 'total_coins_earned':
                return stats.totalCoinsEarned >= condition.value;
            case 'stars_collected':
                return stats.starsCollected >= condition.value;
            case 'minigames_won':
                return stats.minigamesWon >= condition.value;
            case 'friends_added':
                return stats.friendsAdded >= condition.value;
            case 'consecutive_sixes':
                return stats.consecutiveSixes >= condition.value;
            case 'unique_spaces_visited':
                return stats.uniqueSpacesVisited.size >= condition.value;
            default:
                return false;
        }
    }

    // Grant achievement rewards
    grantAchievementRewards(playerId, achievement) {
        const player = this.getPlayerData(playerId);
        const rewards = achievement.rewards;
        
        if (rewards.xp) {
            this.addXP(playerId, rewards.xp, `achievement_${achievement.id}`);
        }
        
        if (rewards.coins) {
            this.updateStats(playerId, { totalCoinsEarned: rewards.coins });
        }
        
        if (rewards.skillPoints) {
            player.skillPoints += rewards.skillPoints;
        }
        
        if (rewards.title) {
            player.titles.push(rewards.title);
        }
        
        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    // Get player achievements
    getPlayerAchievements(playerId) {
        const player = this.getPlayerData(playerId);
        
        return Object.values(ACHIEVEMENTS).map(achievement => ({
            ...achievement,
            unlocked: player.achievements.has(achievement.id),
            progress: this.getAchievementProgress(player, achievement)
        }));
    }

    // Get achievement progress percentage
    getAchievementProgress(player, achievement) {
        const condition = achievement.condition;
        const stats = player.stats;
        
        let current = 0;
        
        switch (condition.type) {
            case 'games_completed':
                current = stats.gamesPlayed;
                break;
            case 'games_won':
                current = stats.gamesWon;
                break;
            case 'total_coins_earned':
                current = stats.totalCoinsEarned;
                break;
            case 'stars_collected':
                current = stats.starsCollected;
                break;
            case 'minigames_won':
                current = stats.minigamesWon;
                break;
            case 'friends_added':
                current = stats.friendsAdded;
                break;
            case 'consecutive_sixes':
                current = stats.consecutiveSixes;
                break;
            case 'unique_spaces_visited':
                current = stats.uniqueSpacesVisited.size;
                break;
        }
        
        return Math.min(100, Math.floor((current / condition.value) * 100));
    }

    // Apply skill effects to game mechanics
    applySkillEffects(playerId, context, baseValue) {
        const player = this.getPlayerData(playerId);
        let modifiedValue = baseValue;
        
        // Apply dice bonuses
        if (context === 'dice_roll') {
            const luckyRollsLevel = this.getSkillLevel(playerId, 'dice_master', 'lucky_rolls');
            if (luckyRollsLevel > 0) {
                const skill = SKILL_TREES.DICE_MASTER.skills.lucky_rolls;
                const bonus = skill.effects.diceBonus[luckyRollsLevel - 1];
                if (Math.random() < bonus) {
                    modifiedValue = Math.min(6, modifiedValue + 1);
                }
            }
        }
        
        // Apply coin bonuses
        if (context === 'coin_gain') {
            const coinBoostLevel = this.getSkillLevel(playerId, 'coin_collector', 'coin_boost');
            if (coinBoostLevel > 0) {
                const skill = SKILL_TREES.COIN_COLLECTOR.skills.coin_boost;
                const bonus = skill.effects.coinBonus[coinBoostLevel - 1];
                modifiedValue += bonus;
            }
        }
        
        // Apply mini-game bonuses
        if (context === 'minigame_score') {
            const reflexesLevel = this.getSkillLevel(playerId, 'minigame_champion', 'quick_reflexes');
            if (reflexesLevel > 0) {
                const skill = SKILL_TREES.MINIGAME_CHAMPION.skills.quick_reflexes;
                const bonus = skill.effects.skillGameBonus[reflexesLevel - 1];
                modifiedValue = Math.floor(modifiedValue * (1 + bonus));
            }
        }
        
        // Apply energy efficiency
        if (context === 'energy_consumption') {
            const energySaverLevel = this.getSkillLevel(playerId, 'energy_efficient', 'energy_saver');
            if (energySaverLevel > 0) {
                const skill = SKILL_TREES.ENERGY_EFFICIENT.skills.energy_saver;
                const saveChance = skill.effects.energySaveChance[energySaverLevel - 1];
                if (Math.random() < saveChance) {
                    modifiedValue = 0; // Don't consume energy
                }
            }
        }
        
        return modifiedValue;
    }

    // Get available skill trees for player
    getAvailableSkillTrees(playerId) {
        return Object.values(SKILL_TREES).map(tree => ({
            ...tree,
            playerData: this.getSkillTree(playerId, tree.id)
        }));
    }

    // Get player profile summary
    getPlayerProfile(playerId) {
        const player = this.getPlayerData(playerId);
        const xpToNext = this.getXPToNextLevel(playerId);
        const xpProgress = this.getXPProgress(playerId);
        
        return {
            playerId,
            level: player.level,
            xp: player.xp,
            xpToNextLevel: xpToNext,
            xpProgress,
            skillPoints: player.skillPoints,
            achievements: player.achievements.size,
            totalAchievements: Object.keys(ACHIEVEMENTS).length,
            titles: player.titles,
            stats: {
                ...player.stats,
                uniqueSpacesVisited: player.stats.uniqueSpacesVisited.size,
                winRate: player.stats.gamesPlayed > 0 ? 
                    Math.round((player.stats.gamesWon / player.stats.gamesPlayed) * 100) : 0
            },
            memberSince: player.createdAt,
            lastActive: player.lastUpdated
        };
    }

    // Reset skills (respec)
    resetSkills(playerId, cost = 100) {
        const player = this.getPlayerData(playerId);
        
        // Check if player can afford respec
        if (player.stats.totalCoinsEarned < cost) {
            throw new Error(`Not enough coins for skill reset. Need ${cost} coins.`);
        }
        
        // Calculate skill points to refund
        let refundedPoints = 0;
        player.skills.forEach((level, skillKey) => {
            const [treeId, skillId] = skillKey.split('_');
            const skill = SKILL_TREES[treeId.toUpperCase()]?.skills[skillId];
            if (skill) {
                for (let i = 0; i < level; i++) {
                    refundedPoints += skill.cost[i];
                }
            }
        });
        
        // Reset skills and refund points
        player.skills.clear();
        player.skillPoints += refundedPoints;
        player.stats.totalCoinsEarned -= cost;
        player.lastUpdated = Date.now();
        
        this.savePlayerData(playerId);
        
        return refundedPoints;
    }

    // Save player data to localStorage (in production, this would be to a database)
    savePlayerData(playerId) {
        const player = this.getPlayerData(playerId);
        const saveData = {
            ...player,
            skills: Object.fromEntries(player.skills),
            achievements: Array.from(player.achievements),
            stats: {
                ...player.stats,
                uniqueSpacesVisited: Array.from(player.stats.uniqueSpacesVisited)
            }
        };
        
        localStorage.setItem(`player_progression_${playerId}`, JSON.stringify(saveData));
    }

    // Load player data from localStorage
    loadPlayerData() {
        // This would load all player data in production
        // For now, it's handled per-player when getPlayerData is called
    }

    // Load specific player data
    loadSpecificPlayerData(playerId) {
        const saved = localStorage.getItem(`player_progression_${playerId}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Convert arrays back to Maps/Sets
                data.skills = new Map(Object.entries(data.skills));
                data.achievements = new Set(data.achievements);
                data.stats.uniqueSpacesVisited = new Set(data.stats.uniqueSpacesVisited);
                
                this.playerData.set(playerId, data);
                return data;
            } catch (error) {
                console.error('Failed to load player data:', error);
            }
        }
        return null;
    }

    // Get leaderboard
    getLeaderboard(type = 'level', limit = 10) {
        const players = Array.from(this.playerData.values());
        
        let sortFn;
        switch (type) {
            case 'level':
                sortFn = (a, b) => b.level - a.level || b.xp - a.xp;
                break;
            case 'xp':
                sortFn = (a, b) => b.xp - a.xp;
                break;
            case 'wins':
                sortFn = (a, b) => b.stats.gamesWon - a.stats.gamesWon;
                break;
            case 'coins':
                sortFn = (a, b) => b.stats.totalCoinsEarned - a.stats.totalCoinsEarned;
                break;
            case 'achievements':
                sortFn = (a, b) => b.achievements.size - a.achievements.size;
                break;
            default:
                sortFn = (a, b) => b.level - a.level;
        }
        
        return players
            .sort(sortFn)
            .slice(0, limit)
            .map((player, index) => ({
                rank: index + 1,
                playerId: player.playerId,
                level: player.level,
                xp: player.xp,
                value: type === 'level' ? player.level :
                       type === 'xp' ? player.xp :
                       type === 'wins' ? player.stats.gamesWon :
                       type === 'coins' ? player.stats.totalCoinsEarned :
                       type === 'achievements' ? player.achievements.size : player.level
            }));
    }

    // Log XP gain for analytics
    logXPGain(playerId, amount, source) {
        console.log('XP Gained:', {
            playerId,
            amount,
            source,
            timestamp: Date.now()
        });
    }

    // Get daily/weekly bonuses
    getDailyBonus(playerId) {
        const player = this.getPlayerData(playerId);
        const today = new Date().toDateString();
        const lastBonus = localStorage.getItem(`daily_xp_bonus_${playerId}`);
        
        if (lastBonus !== today) {
            localStorage.setItem(`daily_xp_bonus_${playerId}`, today);
            const bonusXP = 50 + (player.level * 5); // Scaling daily bonus
            this.addXP(playerId, bonusXP, 'daily_bonus');
            return bonusXP;
        }
        
        return null;
    }

    // Award XP for various actions
    awardActionXP(playerId, action, details = {}) {
        const xpRewards = {
            game_completed: 25,
            game_won: 100,
            star_collected: 50,
            minigame_won: 30,
            minigame_participated: 10,
            space_visited: 2,
            friend_added: 20,
            achievement_unlocked: 0 // Handled separately
        };
        
        const baseXP = xpRewards[action] || 0;
        if (baseXP > 0) {
            this.addXP(playerId, baseXP, action);
            
            // Update relevant stats
            const statUpdates = {};
            switch (action) {
                case 'game_completed':
                    statUpdates.gamesPlayed = 1;
                    break;
                case 'game_won':
                    statUpdates.gamesWon = 1;
                    break;
                case 'star_collected':
                    statUpdates.starsCollected = 1;
                    break;
                case 'minigame_won':
                    statUpdates.minigamesWon = 1;
                    break;
                case 'space_visited':
                    if (details.spaceType) {
                        statUpdates.uniqueSpacesVisited = details.spaceType;
                    }
                    break;
                case 'friend_added':
                    statUpdates.friendsAdded = 1;
                    break;
            }
            
            if (Object.keys(statUpdates).length > 0) {
                this.updateStats(playerId, statUpdates);
            }
        }
        
        return baseXP;
    }
}