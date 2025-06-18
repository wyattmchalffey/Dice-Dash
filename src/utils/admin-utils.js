// src/utils/admin-utils.js
import { db } from '../config/firebase-config';
import { 
  collection, 
  getDocs, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

export class AdminUtils {
  // Clear all games from the database
  static async clearAllGames() {
    try {
      const gamesRef = collection(db, 'games');
      const snapshot = await getDocs(gamesRef);
      
      const deletePromises = [];
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${deletePromises.length} games`);
      return deletePromises.length;
    } catch (error) {
      console.error('Error clearing games:', error);
      throw error;
    }
  }

  // Clear old games (older than specified days)
  static async clearOldGames(daysOld = 7) {
    try {
      const gamesRef = collection(db, 'games');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const q = query(
        gamesRef,
        where('createdAt', '<', cutoffDate)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = [];
      
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${deletePromises.length} old games`);
      return deletePromises.length;
    } catch (error) {
      console.error('Error clearing old games:', error);
      throw error;
    }
  }

  // Clear games by status
  static async clearGamesByStatus(status) {
    try {
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, where('status', '==', status));
      
      const snapshot = await getDocs(q);
      const deletePromises = [];
      
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${deletePromises.length} ${status} games`);
      return deletePromises.length;
    } catch (error) {
      console.error(`Error clearing ${status} games:`, error);
      throw error;
    }
  }

  // Get game statistics
  static async getGameStats() {
    try {
      const gamesRef = collection(db, 'games');
      const snapshot = await getDocs(gamesRef);
      
      const stats = {
        total: 0,
        waiting: 0,
        active: 0,
        completed: 0,
        totalPlayers: 0
      };
      
      snapshot.forEach((doc) => {
        const game = doc.data();
        stats.total++;
        stats[game.status]++;
        stats.totalPlayers += game.players.length;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting game stats:', error);
      throw error;
    }
  }
}