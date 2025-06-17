// src/services/game-service.js
import { db } from '../config/firebase-config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

export class GameService {
  // Create a new game
  async createGame(hostUser, gameSettings = {}) {
    try {
      const now = new Date();
      const gameData = {
        hostId: hostUser.uid,
        hostName: hostUser.displayName || 'Host',
        players: [
          {
            userId: hostUser.uid,
            name: hostUser.displayName || 'Host',
            position: 0,
            coins: 20,
            stars: 0,
            energy: 5,
            maxEnergy: 5,
            color: 'bg-blue-500',
            isOnline: true,
            joinedAt: now,
            lastActivity: now
          }
        ],
        status: 'waiting', // waiting, active, completed
        currentTurn: 0,
        boardId: gameSettings.boardId || 'default',
        maxPlayers: gameSettings.maxPlayers || 4,
        energyRegenRate: 3600, // seconds per energy
        gameCode: this.generateGameCode(),
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        winner: null
      };

      const docRef = await addDoc(collection(db, 'games'), gameData);
      return { id: docRef.id, ...gameData };
    } catch (error) {
      throw new Error(`Failed to create game: ${error.message}`);
    }
  }

  // Join game by code
  async joinGameByCode(gameCode, user) {
    try {
      // Find game with this code
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef, 
        where('gameCode', '==', gameCode),
        where('status', '==', 'waiting')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Game not found or already started');
      }

      const gameDoc = querySnapshot.docs[0];
      const gameData = gameDoc.data();

      if (gameData.players.length >= gameData.maxPlayers) {
        throw new Error('Game is full');
      }

      // Check if user already in game
      if (gameData.players.some(p => p.userId === user.uid)) {
        throw new Error('You are already in this game');
      }

      const playerColors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500'];
      const usedColors = gameData.players.map(p => p.color);
      const availableColor = playerColors.find(color => !usedColors.includes(color));

      const now = new Date();
      const newPlayer = {
        userId: user.uid,
        name: user.displayName || 'Player',
        position: 0,
        coins: 20,
        stars: 0,
        energy: 5,
        maxEnergy: 5,
        color: availableColor,
        isOnline: true,
        joinedAt: now,
        lastActivity: now
      };

      await updateDoc(doc(db, 'games', gameDoc.id), {
        players: arrayUnion(newPlayer),
        lastActivity: serverTimestamp()
      });

      return gameDoc.id;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Start game (host only)
  async startGame(gameId, hostUserId) {
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameSnap.data();
      
      if (gameData.hostId !== hostUserId) {
        throw new Error('Only the host can start the game');
      }

      if (gameData.players.length < 2) {
        throw new Error('Need at least 2 players to start');
      }

      await updateDoc(gameRef, {
        status: 'active',
        startedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Make a move (async - no turn restrictions)
  async makeMove(gameId, playerId, moveData) {
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

      // Check if player has enough energy
      if (gameData.players[playerIndex].energy < 1) {
        throw new Error('Not enough energy');
      }

      // Update player data
      const updatedPlayers = [...gameData.players];
      const now = new Date();
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        position: moveData.newPosition,
        coins: moveData.newCoins,
        stars: moveData.newStars || updatedPlayers[playerIndex].stars,
        energy: moveData.newEnergy,
        lastMove: now,
        lastActivity: now
      };

      await updateDoc(gameRef, {
        players: updatedPlayers,
        lastActivity: serverTimestamp()
      });

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Listen to game updates
  subscribeToGame(gameId, callback) {
    const gameRef = doc(db, 'games', gameId);
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
  }

  // Get user's active games
  async getUserGames(userId) {
    try {
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef,
        where('players', 'array-contains-any', [{ userId: userId }]),
        orderBy('lastActivity', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const games = [];
      
      querySnapshot.docs.forEach(doc => {
        const gameData = doc.data();
        // Check if user is actually in this game
        if (gameData.players.some(player => player.userId === userId)) {
          games.push({
            id: doc.id,
            ...gameData
          });
        }
      });
      
      return games;
    } catch (error) {
      // If the query fails (likely due to indexing), fall back to getting all games
      // and filtering client-side (less efficient but works)
      try {
        const gamesRef = collection(db, 'games');
        const q = query(gamesRef, orderBy('lastActivity', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const games = [];
        
        querySnapshot.docs.forEach(doc => {
          const gameData = doc.data();
          // Check if user is in this game
          if (gameData.players.some(player => player.userId === userId)) {
            games.push({
              id: doc.id,
              ...gameData
            });
          }
        });
        
        return games.slice(0, 10); // Limit to 10 most recent
      } catch (fallbackError) {
        console.error('Failed to get games:', fallbackError);
        return [];
      }
    }
  }

  // Generate random game code
  generateGameCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Update player online status
  async updatePlayerStatus(gameId, userId, isOnline) {
    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) return;

      const gameData = gameSnap.data();
      const now = new Date();
      const updatedPlayers = gameData.players.map(player => 
        player.userId === userId 
          ? { ...player, isOnline, lastActivity: now }
          : player
      );

      await updateDoc(gameRef, {
        players: updatedPlayers,
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update player status:', error);
    }
  }
}