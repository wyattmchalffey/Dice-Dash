import Phaser from 'phaser';
import Board from '../entities/Board';
import Player from '../entities/Player';
import Dice from '../entities/Dice';
import { SPACE_CONFIG } from '../../shared/constants/SpaceTypes';
import { SOCKET_EVENTS } from '../../shared/constants/Events';

export default class BoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BoardScene' });
    this.players = new Map();
    this.currentPlayerId = null;
    this.isMyTurn = false;
    this.board = null;
    this.dice = null;
    this.uiElements = {};
  }

  init(data) {
    console.log('BoardScene init with data:', data);
    this.boardType = data.boardType || 'demo';
    this.socketManager = data.socketManager;
    this.playerData = data.playerData;
    this.roomData = data.roomData;
  }

  create() {
    console.log('BoardScene create started');
    
    // Create board
    this.board = new Board(this, this.boardType);
    this.board.create();
    
    // Create UI first
    this.createUI();
    
    // Create players
    if (this.roomData && this.roomData.gameState && this.roomData.gameState.players) {
      console.log('Creating players from room data:', this.roomData.gameState.players);
      this.roomData.gameState.players.forEach(playerData => {
        this.createPlayer(playerData);
      });
    } else if (this.playerData) {
      // Create player from the join response
      const player = {
        id: this.roomData?.playerId || this.playerData.id,
        name: this.playerData.name,
        position: 0,
        coins: 10,
        energy: 5,
        color: 0xff6b6b
      };
      console.log('Creating player from playerData:', player);
      this.createPlayer(player);
    } else {
      // Fallback demo player
      const demoPlayer = {
        id: 'demo-player',
        name: 'Demo Player',
        position: 0,
        coins: 10,
        energy: 5,
        color: 0xff6b6b
      };
      console.log('Creating fallback demo player:', demoPlayer);
      this.createPlayer(demoPlayer);
    }
    
    // Set current player - IMPORTANT FIX HERE
    if (this.roomData && this.roomData.gameState && this.roomData.gameState.currentPlayer) {
      // Use the server's current player
      this.currentPlayerId = this.roomData.gameState.currentPlayer;
      this.isMyTurn = (this.currentPlayerId === (this.roomData?.playerId || this.playerData?.id));
    } else if (this.roomData?.playerId) {
      // Use the player ID from join response
      this.currentPlayerId = this.roomData.playerId;
      this.isMyTurn = true;
    } else if (this.playerData) {
      this.currentPlayerId = this.playerData.id;
      this.isMyTurn = true;
    } else {
      // Demo mode - set first player as current
      const firstPlayer = this.players.values().next().value;
      if (firstPlayer) {
        this.currentPlayerId = firstPlayer.id;
        this.isMyTurn = true;
      }
    }
    
    console.log('Current player ID:', this.currentPlayerId);
    console.log('Is my turn:', this.isMyTurn);
    console.log('Available players:', Array.from(this.players.keys()));
    
    this.updateTurnIndicator();
    
    // Set up socket listeners
    if (this.socketManager) {
      this.setupSocketListeners();
    }
    
    // Camera controls
    this.setupCamera();
    
    console.log('BoardScene create completed');
  }

  createUI() {
    const { width, height } = this.cameras.main;
    
    // Top bar - Energy and Coins
    const topBarY = 30;
    
    // Energy display (top-left)
    this.uiElements.energyContainer = this.add.container(50, topBarY);
    this.uiElements.energyTitle = this.add.text(0, -10, 'Energy', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    
    // Energy bars
    this.uiElements.energyBars = [];
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(i * 25, 10, 20, 15, 0xffcc00);
      this.uiElements.energyBars.push(bar);
      this.uiElements.energyContainer.add(bar);
    }
    
    this.uiElements.energyContainer.add([this.uiElements.energyTitle, ...this.uiElements.energyBars]);
    
    // Coins display (top-center)
    this.uiElements.coinsText = this.add.text(width / 2, topBarY, '🪙 10', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    
    // Turn indicator (top-right)
    this.uiElements.turnText = this.add.text(width - 50, topBarY, 'Your Turn!', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
    
    // Players list (left side)
    const playersX = 50;
    const playersY = 150;
    
    const playersBg = this.add.rectangle(playersX, playersY, 200, 300, 0xffffff, 0.9);
    playersBg.setStrokeStyle(2, 0x333333);
    
    this.uiElements.playersTitle = this.add.text(playersX, playersY - 130, 'Players', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiElements.playersList = this.add.container(playersX - 80, playersY - 100);
    this.uiElements.playersContainer = this.add.container(0, 0);
    this.uiElements.playersContainer.add([playersBg, this.uiElements.playersTitle, this.uiElements.playersList]);
    
    // Dice and Roll button (bottom-center) - FIXED POSITIONING
    const bottomY = height - 80;
    
    // Create dice BEFORE creating UI elements that reference it
    this.dice = new Dice(this, width / 2 - 80, bottomY);
    this.dice.create();
    
    // Roll button
    this.uiElements.rollButton = this.add.image(width / 2 + 40, bottomY, 'button_red')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        console.log('Roll button clicked!');
        this.rollDice();
      })
      .on('pointerover', () => this.uiElements.rollButton.setTint(0xcccccc))
      .on('pointerout', () => this.uiElements.rollButton.clearTint());
    
    this.uiElements.rollButtonText = this.add.text(width / 2 + 40, bottomY, 'Roll Dice', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Debug info (bottom-left)
    this.uiElements.debugText = this.add.text(20, height - 20, 'Debug: Ready', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0, 1);
  }

  createPlayer(playerData) {
    console.log('Creating player:', playerData);
    
    const startSpace = this.board.getSpace(0);
    if (!startSpace) {
      console.error('Could not find start space');
      return;
    }
    
    const player = new Player(
      this,
      playerData.id,
      playerData.name,
      startSpace.x,
      startSpace.y,
      playerData.color || 0xff6b6b
    );
    
    this.players.set(playerData.id, player);
    
    // Update player state with data
    if (playerData.coins !== undefined) {
      player.updateCoins(playerData.coins);
    }
    
    // Update players list UI
    this.updatePlayersList();
    
    console.log('Player created successfully:', playerData.id);
    return player;
  }

  updatePlayersList() {
    // Clear existing list
    this.uiElements.playersList.removeAll(true);
    
    let yOffset = 0;
    this.players.forEach(player => {
      const playerItem = this.add.container(0, yOffset);
      
      // Player color indicator
      const colorIndicator = this.add.circle(0, 0, 10, player.color);
      
      // Player name
      const nameText = this.add.text(20, 0, player.name, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#333333'
      }).setOrigin(0, 0.5);
      
      // Current player indicator
      if (player.id === this.currentPlayerId) {
        nameText.setStyle({ fontStyle: 'bold', color: '#ff6b6b' });
      }
      
      playerItem.add([colorIndicator, nameText]);
      this.uiElements.playersList.add(playerItem);
      
      yOffset += 30;
    });
  }

  rollDice() {
    console.log('rollDice() called');
    console.log('isMyTurn:', this.isMyTurn);
    console.log('dice exists:', !!this.dice);
    console.log('dice.isRolling:', this.dice?.isRolling);
    console.log('currentPlayerId:', this.currentPlayerId);
    console.log('playerData?.id:', this.playerData?.id);
    
    // Check conditions
    if (!this.isMyTurn) {
      console.log('Not your turn!');
      this.showNotification('Not your turn!');
      return;
    }
    
    if (!this.dice) {
      console.log('No dice object!');
      this.showNotification('Dice not ready!');
      return;
    }
    
    if (this.dice.isRolling) {
      console.log('Dice already rolling!');
      return;
    }
    
    const currentPlayer = this.players.get(this.currentPlayerId || this.playerData?.id);
    if (!currentPlayer) {
      console.log('No current player found!');
      console.log('Available players:', Array.from(this.players.keys()));
      this.showNotification('Player not found!');
      return;
    }
    
    console.log('All conditions passed, rolling dice...');
    
    // Update debug text
    this.uiElements.debugText.setText('Debug: Rolling...');
    
    // Disable button
    this.uiElements.rollButton.setAlpha(0.5);
    this.uiElements.rollButton.disableInteractive();
    
    // Send roll request to server or handle locally
    if (this.socketManager && this.socketManager.isConnected()) {
      console.log('Sending roll request to server...');
      this.socketManager.emit(SOCKET_EVENTS.REQUEST_ROLL);
    } else {
      // Local testing
      console.log('No socket connection, handling locally...');
      const result = Math.floor(Math.random() * 6) + 1;
      console.log('Local roll result:', result);
      
      this.handleDiceRoll({
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        diceResult: { rolls: [result], total: result }
      });
    }
  }

  handleDiceRoll(data) {
    console.log('handleDiceRoll called with:', data);
    
    const player = this.players.get(data.playerId);
    if (!player) {
      console.log('Player not found for dice roll:', data.playerId);
      return;
    }
    
    // Animate dice
    this.dice.roll(data.diceResult.total, () => {
      console.log('Dice roll animation complete');
      
      // Re-enable button after a delay
      this.time.delayedCall(1000, () => {
        this.uiElements.rollButton.setAlpha(1);
        this.uiElements.rollButton.setInteractive();
        this.uiElements.debugText.setText('Debug: Ready');
      });
    });
    
    // Show notification
    this.showNotification(`${data.playerName} rolled ${data.diceResult.total}!`);
    
    // TODO: Move player based on roll result
    // For now, just log it
    console.log(`Player ${data.playerName} should move ${data.diceResult.total} spaces`);
  }

  showNotification(message) {
    console.log('Notification:', message);
    
    // Remove existing notification
    if (this.currentNotification) {
      this.currentNotification.destroy();
    }
    
    // Create new notification
    const { width, height } = this.cameras.main;
    this.currentNotification = this.add.text(width / 2, height / 2 - 100, message, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    // Fade out after delay
    this.time.delayedCall(2000, () => {
      if (this.currentNotification) {
        this.tweens.add({
          targets: this.currentNotification,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            if (this.currentNotification) {
              this.currentNotification.destroy();
              this.currentNotification = null;
            }
          }
        });
      }
    });
  }

  updateTurnIndicator() {
    const currentPlayer = this.players.get(this.currentPlayerId);
    if (currentPlayer) {
      const text = this.isMyTurn ? 'Your Turn!' : `${currentPlayer.name}'s Turn`;
      this.uiElements.turnText.setText(text);
      this.uiElements.turnText.setColor(this.isMyTurn ? '#ff6b6b' : '#666666');
    }
  }

  setupSocketListeners() {
    if (!this.socketManager) return;
    
    console.log('Setting up socket listeners...');
    
    // Game state update
    this.socketManager.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data) => {
      console.log('Game state update received:', data);
      
      // Update current player and turn state
      if (data.currentPlayer) {
        this.currentPlayerId = data.currentPlayer;
        this.isMyTurn = (data.currentPlayer === (this.roomData?.playerId || this.playerData?.id));
        this.updateTurnIndicator();
        
        // Update roll button state
        if (this.isMyTurn) {
          this.uiElements.rollButton.setAlpha(1);
          this.uiElements.rollButton.setInteractive();
        } else {
          this.uiElements.rollButton.setAlpha(0.5);
          this.uiElements.rollButton.disableInteractive();
        }
      }
    });
    
    // Player joined
    this.socketManager.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      console.log('Player joined:', data);
      this.createPlayer(data.player);
    });
    
    // Player left
    this.socketManager.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      console.log('Player left:', data);
      const player = this.players.get(data.playerId);
      if (player) {
        player.destroy();
        this.players.delete(data.playerId);
        this.updatePlayersList();
      }
    });
    
    // Dice rolled
    this.socketManager.on(SOCKET_EVENTS.DICE_ROLLED, (data) => {
      console.log('Dice rolled event received:', data);
      this.handleDiceRoll(data);
    });
    
    // Player moving
    this.socketManager.on(SOCKET_EVENTS.PLAYER_MOVING, (data) => {
      console.log('Player moving event received:', data);
      this.handlePlayerMove(data);
    });
    
    // Player moved (completion)
    this.socketManager.on(SOCKET_EVENTS.PLAYER_MOVED, (data) => {
      console.log('Player moved event received:', data);
      // Handle any post-movement logic if needed
    });
    
    // Space action
    this.socketManager.on(SOCKET_EVENTS.SPACE_ACTION, (data) => {
      console.log('Space action event received:', data);
      this.handleSpaceAction(data);
    });
    
    // Energy updated
    this.socketManager.on(SOCKET_EVENTS.ENERGY_UPDATED, (data) => {
      console.log('Energy updated event received:', data);
      this.updateEnergy(data);
    });
    
    // Energy regenerated
    this.socketManager.on(SOCKET_EVENTS.ENERGY_REGENERATED, (data) => {
      console.log('Energy regenerated event received:', data);
      this.updateEnergy(data);
    });
    
    // Coins updated
    this.socketManager.on(SOCKET_EVENTS.COINS_UPDATED, (data) => {
      console.log('Coins updated event received:', data);
      if (data.playerId === (this.roomData?.playerId || this.playerData?.id)) {
        this.updateCoinsDisplay(data.coins);
      }
    });
    
    // Next turn
    this.socketManager.on(SOCKET_EVENTS.NEXT_TURN, (data) => {
      console.log('Next turn event received:', data);
      this.handleNextTurn(data);
    });
  }

  handlePlayerMove(data) {
    console.log('handlePlayerMove called with:', data);
    const player = this.players.get(data.playerId);
    if (!player) {
      console.log('Player not found for movement:', data.playerId);
      return;
    }
    
    // Get the board spaces for the path
    const fromSpace = this.board.getSpace(data.from);
    const toSpace = this.board.getSpace(data.to);
    
    if (!fromSpace || !toSpace) {
      console.log('Invalid space positions:', data.from, data.to);
      return;
    }
    
    // Create movement path
    const path = [];
    const totalSpaces = data.spaces;
    
    for (let i = 1; i <= totalSpaces; i++) {
      const spaceIndex = (data.from + i) % this.board.spaces.length;
      const space = this.board.getSpace(spaceIndex);
      if (space) {
        path.push(space);
      }
    }
    
    console.log('Moving player along path:', path.length, 'spaces');
    
    // Animate player movement
    if (path && path.length > 0) {
      player.moveAlongPath(path, this.board);
    } else {
      // Fallback: move directly to target position
      player.moveTo(toSpace.x, toSpace.y);
    }
  }

  handleSpaceAction(data) {
    console.log('handleSpaceAction called with:', data);
    const player = this.players.get(data.playerId);
    if (!player) return;
    
    const space = this.board.getSpace(player.currentSpace);
    const config = SPACE_CONFIG[data.spaceType];
    
    // Show space effect
    if (space && config) {
      this.showSpaceEffect(space.x, space.y, config.color, data.result.message);
    }
    
    // Update player coins
    if (data.result.coins) {
      player.updateCoins(player.coins + data.result.coins);
      if (player.id === this.playerData?.id) {
        this.updateCoinsDisplay(player.coins);
      }
    }
    
    // Handle special actions
    if (data.result.action === 'start_minigame') {
      this.scene.launch('MinigameScene', {
        playerId: data.playerId,
        minigameType: 'memory_match'
      });
    }
  }

  handleNextTurn(data) {
    console.log('handleNextTurn called with:', data);
    this.currentPlayerId = data.currentPlayer;
    this.isMyTurn = (data.currentPlayer === (this.roomData?.playerId || this.playerData?.id));
    
    // Update UI
    this.updatePlayersList();
    this.updateTurnIndicator();
    
    // Enable/disable roll button
    if (this.isMyTurn) {
      this.uiElements.rollButton.setAlpha(1);
      this.uiElements.rollButton.setInteractive();
      this.showNotification("It's your turn!");
    } else {
      this.uiElements.rollButton.setAlpha(0.5);
      this.uiElements.rollButton.disableInteractive();
    }
  }

  updateEnergy(data) {
    console.log('updateEnergy called with:', data);
    
    // Update energy bars
    this.uiElements.energyBars.forEach((bar, index) => {
      if (index < data.currentEnergy) {
        bar.setFillStyle(0xffcc00);  // Yellow for filled energy
      } else {
        bar.setFillStyle(0xcccccc);  // Gray for empty energy
      }
    });
    
    // Update energy text if it exists
    if (this.uiElements.energyText) {
      this.uiElements.energyText.setText(`Energy: ${data.currentEnergy}/${data.maxEnergy || 5}`);
    }
  }

  updateCoinsDisplay(coins) {
    this.uiElements.coinsText.setText(`🪙 ${coins}`);
  }

  showSpaceEffect(x, y, color, message) {
    // Create a visual effect at the space
    const effect = this.add.circle(x, y, 50, color, 0.7);
    
    this.tweens.add({
      targets: effect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      onComplete: () => effect.destroy()
    });
    
    this.showNotification(message);
  }

  setupCamera() {
    // Set camera bounds to match the game area
    this.cameras.main.setBounds(0, 0, 1200, 800);
    
    // Center the camera on the board
    this.cameras.main.centerOn(600, 400);
  }

  update(time, delta) {
    // Update game entities
    if (this.dice) {
      this.dice.update(time, delta);
    }
    
    this.players.forEach(player => {
      if (player.update) {
        player.update(time, delta);
      }
    });
  }
}