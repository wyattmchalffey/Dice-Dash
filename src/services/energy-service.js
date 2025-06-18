// src/services/energy-service.js
import { db } from '../config/firebase-config';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export class EnergyService {
  constructor() {
    this.ENERGY_REGEN_RATE = 3600; // seconds per energy (1 hour)
    this.MAX_ENERGY = 5;
  }

  // Calculate current energy based on last update time
  calculateCurrentEnergy(player) {
    if (!player.lastEnergyUpdate) {
      return player.energy || this.MAX_ENERGY;
    }

    const lastUpdate = player.lastEnergyUpdate.toDate ? player.lastEnergyUpdate.toDate() : player.lastEnergyUpdate;
    const now = new Date();
    const timeDiff = (now - lastUpdate) / 1000; // seconds
    
    const energyToRegen = Math.floor(timeDiff / this.ENERGY_REGEN_RATE);
    const currentEnergy = Math.min(player.energy + energyToRegen, player.maxEnergy || this.MAX_ENERGY);
    
    return currentEnergy;
  }

  // Get time until next energy regeneration
  getTimeUntilNextEnergy(player) {
    if (!player.lastEnergyUpdate || player.energy >= (player.maxEnergy || this.MAX_ENERGY)) {
      return 0;
    }

    const lastUpdate = player.lastEnergyUpdate.toDate ? player.lastEnergyUpdate.toDate() : player.lastEnergyUpdate;
    const now = new Date();
    const timeDiff = (now - lastUpdate) / 1000; // seconds
    
    const timeInCurrentCycle = timeDiff % this.ENERGY_REGEN_RATE;
    const timeUntilNext = this.ENERGY_REGEN_RATE - timeInCurrentCycle;
    
    return Math.ceil(timeUntilNext);
  }

  // Update player energy in database
  async updatePlayerEnergy(gameId, playerId, energyUsed = 0) {
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();
      const playerIndex = gameData.players.findIndex(p => p.userId === playerId);
      
      if (playerIndex === -1) {
        throw new Error('Player not found in game');
      }

      const player = gameData.players[playerIndex];
      const currentEnergy = this.calculateCurrentEnergy(player);
      const newEnergy = Math.max(0, currentEnergy - energyUsed);
      
      const updatedPlayers = [...gameData.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        energy: newEnergy,
        lastEnergyUpdate: serverTimestamp()
      };

      await updateDoc(gameRef, {
        players: updatedPlayers
      });

      return newEnergy;
    } catch (error) {
      throw new Error(`Failed to update energy: ${error.message}`);
    }
  }

  // Purchase energy boost (for monetization)
  async purchaseEnergyBoost(gameId, playerId, boostAmount = 5) {
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();
      const playerIndex = gameData.players.findIndex(p => p.userId === playerId);
      
      if (playerIndex === -1) {
        throw new Error('Player not found in game');
      }

      const updatedPlayers = [...gameData.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        energy: Math.min(
          updatedPlayers[playerIndex].energy + boostAmount,
          updatedPlayers[playerIndex].maxEnergy * 2 // Allow temporary over-max
        ),
        lastEnergyUpdate: serverTimestamp()
      };

      await updateDoc(gameRef, {
        players: updatedPlayers
      });

      return updatedPlayers[playerIndex].energy;
    } catch (error) {
      throw new Error(`Failed to purchase energy boost: ${error.message}`);
    }
  }

  // Format time for display
  formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Ready!';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}