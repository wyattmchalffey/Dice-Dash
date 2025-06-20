// src/systems/energy-system.js
// Core energy management system for MMO Party Quest

export class EnergySystem {
    constructor() {
        this.maxEnergy = 5;
        this.regenerationRate = 20 * 60 * 1000; // 20 minutes in milliseconds
        this.energyKey = 'player_energy';
        this.lastUpdateKey = 'energy_last_update';
    }

    // Get current energy for a player
    getCurrentEnergy(userId) {
        const stored = localStorage.getItem(`${this.energyKey}_${userId}`);
        const lastUpdate = localStorage.getItem(`${this.lastUpdateKey}_${userId}`);
        
        if (!stored || !lastUpdate) {
            // First time player - give full energy
            this.setEnergy(userId, this.maxEnergy);
            return this.maxEnergy;
        }

        const currentEnergy = parseInt(stored);
        const lastUpdateTime = parseInt(lastUpdate);
        const now = Date.now();
        
        // Calculate how much energy should have regenerated
        const timeDiff = now - lastUpdateTime;
        const energyToAdd = Math.floor(timeDiff / this.regenerationRate);
        
        if (energyToAdd > 0) {
            const newEnergy = Math.min(currentEnergy + energyToAdd, this.maxEnergy);
            this.setEnergy(userId, newEnergy);
            return newEnergy;
        }
        
        return currentEnergy;
    }

    // Set energy for a player
    setEnergy(userId, amount) {
        const energy = Math.max(0, Math.min(amount, this.maxEnergy));
        localStorage.setItem(`${this.energyKey}_${userId}`, energy.toString());
        localStorage.setItem(`${this.lastUpdateKey}_${userId}`, Date.now().toString());
        
        // Trigger energy update event
        window.dispatchEvent(new CustomEvent('energyUpdated', {
            detail: { userId, energy, maxEnergy: this.maxEnergy }
        }));
        
        return energy;
    }

    // Spend energy (for taking a turn)
    spendEnergy(userId, amount = 1) {
        const currentEnergy = this.getCurrentEnergy(userId);
        
        if (currentEnergy < amount) {
            throw new Error('Insufficient energy');
        }
        
        const newEnergy = this.setEnergy(userId, currentEnergy - amount);
        return newEnergy;
    }

    // Add energy (from purchases, ads, gifts)
    addEnergy(userId, amount, source = 'unknown') {
        const currentEnergy = this.getCurrentEnergy(userId);
        const newEnergy = this.setEnergy(userId, currentEnergy + amount);
        
        // Log energy gain for analytics
        this.logEnergyGain(userId, amount, source);
        
        return newEnergy;
    }

    // Get time until next energy regeneration
    getTimeToNextEnergy(userId) {
        const currentEnergy = this.getCurrentEnergy(userId);
        
        if (currentEnergy >= this.maxEnergy) {
            return 0; // Already at max energy
        }
        
        const lastUpdate = localStorage.getItem(`${this.lastUpdateKey}_${userId}`);
        if (!lastUpdate) return 0;
        
        const lastUpdateTime = parseInt(lastUpdate);
        const now = Date.now();
        const timeSinceLastRegen = (now - lastUpdateTime) % this.regenerationRate;
        
        return this.regenerationRate - timeSinceLastRegen;
    }

    // Get time until full energy
    getTimeToFullEnergy(userId) {
        const currentEnergy = this.getCurrentEnergy(userId);
        const energyNeeded = this.maxEnergy - currentEnergy;
        
        if (energyNeeded <= 0) return 0;
        
        const timeToNext = this.getTimeToNextEnergy(userId);
        const additionalTime = (energyNeeded - 1) * this.regenerationRate;
        
        return timeToNext + additionalTime;
    }

    // Check if player can take action
    canTakeAction(userId, energyCost = 1) {
        return this.getCurrentEnergy(userId) >= energyCost;
    }

    // Format time for display
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / (60 * 1000));
        const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Energy purchase options
    getEnergyPurchaseOptions() {
        return [
            {
                id: 'energy_1',
                energy: 1,
                price: 0.99,
                label: '+1 Energy'
            },
            {
                id: 'energy_5',
                energy: 5,
                price: 3.99,
                label: 'Full Energy'
            },
            {
                id: 'energy_unlimited_1h',
                duration: 60 * 60 * 1000, // 1 hour
                price: 1.99,
                label: 'Unlimited Energy (1h)'
            }
        ];
    }

    // Watch ad for energy
    watchAdForEnergy(userId) {
        // This would integrate with your ad service
        return new Promise((resolve, reject) => {
            // Simulate ad watching
            setTimeout(() => {
                try {
                    const energyGained = this.addEnergy(userId, 1, 'advertisement');
                    resolve(energyGained);
                } catch (error) {
                    reject(error);
                }
            }, 2000);
        });
    }

    // Log energy events for analytics
    logEnergyGain(userId, amount, source) {
        const event = {
            userId,
            amount,
            source,
            timestamp: Date.now(),
            type: 'energy_gain'
        };
        
        // Send to analytics service
        console.log('Energy Analytics:', event);
    }

    // Daily login bonus energy
    getDailyBonus(userId) {
        const lastBonus = localStorage.getItem(`daily_bonus_${userId}`);
        const today = new Date().toDateString();
        
        if (lastBonus !== today) {
            localStorage.setItem(`daily_bonus_${userId}`, today);
            return this.addEnergy(userId, 2, 'daily_bonus');
        }
        
        return null; // Already claimed today
    }

    // Friend gift energy
    sendEnergyGift(fromUserId, toUserId) {
        // Check if already sent gift today
        const giftKey = `gift_${fromUserId}_${toUserId}_${new Date().toDateString()}`;
        
        if (localStorage.getItem(giftKey)) {
            throw new Error('Already sent gift today');
        }
        
        localStorage.setItem(giftKey, 'true');
        return this.addEnergy(toUserId, 1, 'friend_gift');
    }
}