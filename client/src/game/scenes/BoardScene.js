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
    this.board = null;
    this.dice = null;
    this.uiElements = {};
  }

  init(data) {
    console.log('BoardScene init with data:', data);
    
    // Debug socketManager
    if (data.socketManager) {
      console.log('socketManager type:', typeof data.socketManager);
      console.log('socketManager has "on" method:', typeof data.socketManager.on === 'function');
      console.log('socketManager has "emit" method:', typeof data.socketManager.emit === 'function');
      console.log('socketManager object:', data.socketManager);
    } else {
      console.warn('No socketManager provided in scene data');
    }
    
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
    
    // No more turn-based logic needed
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
    const topBarY = 40;
    
    // Energy display (top-left) - Moved down and right to avoid overlap
    this.uiElements.energyContainer = this.add.container(80, topBarY);
    this.uiElements.energyTitle = this.add.text(0, -15, 'Energy', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    
    // Energy bars
    this.uiElements.energyBars = [];
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(i * 22, 10, 18, 14, 0xffcc00);
      bar.setStrokeStyle(1, 0x333333);
      this.uiElements.energyBars.push(bar);
      this.uiElements.energyContainer.add(bar);
    }
    
    // Energy timer text (shows time until next energy)
    this.uiElements.energyTimer = this.add.text(0, 25, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0, 0.5);
    
    this.uiElements.energyContainer.add([this.uiElements.energyTitle, this.uiElements.energyTimer, ...this.uiElements.energyBars]);
    
    // Start energy timer
    this.startEnergyTimer();
    
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
    
    // Players list (left side) - Adjusted position and size
    const playersX = 80;
    const playersY = 200;
    const playersWidth = 160;
    const playersHeight = 250;
    
    const playersBg = this.add.rectangle(playersX, playersY, playersWidth, playersHeight, 0xffffff, 0.9);
    playersBg.setStrokeStyle(2, 0x333333);
    
    this.uiElements.playersTitle = this.add.text(playersX, playersY - playersHeight/2 + 20, 'Players', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.uiElements.playersList = this.add.container(playersX - playersWidth/2 + 20, playersY - playersHeight/2 + 50);
    this.uiElements.playersContainer = this.add.container(0, 0);
    this.uiElements.playersContainer.add([playersBg, this.uiElements.playersTitle, this.uiElements.playersList]);
    
    // Dice and Roll button (bottom-center) - Better spacing
    const bottomY = height - 80;
    
    // Create dice with more space from button
    this.dice = new Dice(this, width / 2 - 120, bottomY);
    this.dice.create();
    
    // Roll button with adjusted position
    this.uiElements.rollButton = this.add.image(width / 2 + 60, bottomY, 'button_red')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        console.log('Roll button clicked!');
        this.rollDice();
      })
      .on('pointerover', () => this.uiElements.rollButton.setTint(0xcccccc))
      .on('pointerout', () => this.uiElements.rollButton.clearTint());
    
    this.uiElements.rollButtonText = this.add.text(width / 2 + 60, bottomY, 'Roll Dice', {
      fontSize: '18px',
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

  setupCamera() {
    // Set camera bounds to board area
    this.cameras.main.setBounds(0, 0, 1200, 800);
    
    // Enable camera drag
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && pointer.button === 0) {
        this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
        this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
      }
    });
    
    // Zoom controls
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        this.cameras.main.setZoom(Math.max(0.5, zoom - 0.1));
      } else {
        this.cameras.main.setZoom(Math.min(2, zoom + 0.1));
      }
    });
  }

  createPlayer(playerData) {
    console.log('Creating player:', playerData);
    
    // Determine the correct space position
    const spaceIndex = playerData.position || 0;
    const targetSpace = this.board.getSpace(spaceIndex);
    if (!targetSpace) {
      console.error('Could not find space at index:', spaceIndex);
      return;
    }
    
    console.log(`Creating player at space ${spaceIndex} (${targetSpace.x}, ${targetSpace.y})`);
    
    const player = new Player(
      this,
      playerData.id,
      playerData.name,
      targetSpace.x,
      targetSpace.y,
      playerData.color || 0xff6b6b
    );
    
    // Set the correct current space
    player.currentSpace = spaceIndex;
    
    this.players.set(playerData.id, player);
    
    // Update player state with data
    if (playerData.coins !== undefined) {
      player.updateCoins(playerData.coins);
    }
    
    if (playerData.energy !== undefined) {
      player.setEnergy(playerData.energy, playerData.maxEnergy || 5);
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
      const colorIndicator = this.add.circle(0, 0, 8, player.color);
      colorIndicator.setStrokeStyle(1, 0x333333);
      
      // Player name - with smaller font
      const nameText = this.add.text(20, 0, player.name, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#333333'
      }).setOrigin(0, 0.5);
      
      // Add coins display
      const coinsText = this.add.text(100, 0, `🪙${player.coins}`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#666666'
      }).setOrigin(0, 0.5);
      
      playerItem.add([colorIndicator, nameText, coinsText]);
      this.uiElements.playersList.add(playerItem);
      
      yOffset += 25;
    });
  }

  updateTurnIndicator() {
    // Changed to show energy status instead of turn
    const myPlayerId = this.roomData?.playerId || this.playerData?.id || 'demo-player';
    const myPlayer = this.players.get(myPlayerId);
    
    if (myPlayer && myPlayer.energy !== undefined) {
      const energyText = myPlayer.energy > 0 ? 'Roll Available!' : 'No Energy';
      const energyColor = myPlayer.energy > 0 ? '#4ecdc4' : '#999999';
      this.uiElements.turnText.setText(energyText);
      this.uiElements.turnText.setColor(energyColor);
    } else {
      this.uiElements.turnText.setText('Ready!');
      this.uiElements.turnText.setColor('#4ecdc4');
    }
  }

  setupSocketListeners() {
    // Add safety check for socketManager
    if (!this.socketManager) {
      console.warn('No socketManager available - running in offline/demo mode');
      return;
    }
    
    // Additional check for the 'on' method
    if (typeof this.socketManager.on !== 'function') {
      console.error('socketManager does not have an "on" method. Object type:', typeof this.socketManager);
      console.error('socketManager object:', this.socketManager);
      return;
    }
    
    console.log('Setting up socket listeners...');
    
    // Game state update
    this.socketManager.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data) => {
      console.log('Game state update received:', data);
      // No more turn-based updates needed
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
    
    // Removed NEXT_TURN listener - no longer needed
  }

  rollDice() {
    console.log('rollDice() called');
    console.log('dice exists:', !!this.dice);
    console.log('dice.isRolling:', this.dice?.isRolling);
    
    // Get the current player (the one rolling)
    const myPlayerId = this.roomData?.playerId || this.playerData?.id || 'demo-player';
    const currentPlayer = this.players.get(myPlayerId);
    
    console.log('My player ID:', myPlayerId);
    console.log('Current player:', currentPlayer);
    
    // Check conditions
    if (!this.dice) {
      console.log('No dice object!');
      this.showNotification('Dice not ready!');
      return;
    }
    
    if (this.dice.isRolling) {
      console.log('Dice already rolling!');
      return;
    }
    
    if (!currentPlayer) {
      console.log('Player not found!');
      console.log('Available players:', Array.from(this.players.keys()));
      this.showNotification('Player not found!');
      return;
    }
    
    // Check energy (client-side check)
    if (currentPlayer.energy !== undefined && currentPlayer.energy < 1) {
      console.log('No energy!');
      this.showNotification('Not enough energy!');
      return;
    }
    
    console.log('All conditions passed, rolling dice...');
    
    // Update debug text
    this.uiElements.debugText.setText('Debug: Rolling...');
    
    // Disable button temporarily
    this.uiElements.rollButton.setAlpha(0.5);
    this.uiElements.rollButton.disableInteractive();
    
    // Send roll request to server or handle locally
    if (this.socketManager && typeof this.socketManager.emit === 'function') {
      console.log('Sending roll request to server...');
      this.socketManager.emit(SOCKET_EVENTS.REQUEST_ROLL);
    } else {
      // Local/demo mode - handle dice roll locally
      console.log('No socket connection, handling locally...');
      const result = Math.floor(Math.random() * 6) + 1;
      console.log('Local roll result:', result);
      
      // Simulate energy usage
      if (currentPlayer.energy !== undefined) {
        currentPlayer.setEnergy(currentPlayer.energy - 1, currentPlayer.maxEnergy || 5);
        this.updateEnergy({
          playerId: myPlayerId,
          currentEnergy: currentPlayer.energy,
          maxEnergy: currentPlayer.maxEnergy || 5
        });
      }
      
      // Simulate the dice roll event
      this.handleDiceRoll({
        playerId: myPlayerId,
        playerName: currentPlayer.name,
        diceResult: { rolls: [result], total: result }
      });
      
      // Simulate the movement event after a delay
      this.time.delayedCall(1500, () => {
        const newPosition = (currentPlayer.currentSpace + result) % this.board.spaces.length;
        this.handlePlayerMove({
          playerId: myPlayerId,
          from: currentPlayer.currentSpace,
          to: newPosition,
          spaces: result
        });
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
    
    // Store the dice result for fallback movement
    this.lastDiceResult = data.diceResult;
    this.lastDicePlayerId = data.playerId;
    
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
    
    // Set a timeout to check if movement event was received
    // If not, handle movement locally
    this.movementTimeout = this.time.delayedCall(2000, () => {
      if (this.lastDiceResult && this.lastDicePlayerId === data.playerId) {
        console.log('No movement event received from server, handling locally...');
        
        // Calculate new position
        const currentSpace = player.currentSpace || 0;
        const newPosition = (currentSpace + data.diceResult.total) % this.board.spaces.length;
        
        // Trigger movement
        this.handlePlayerMove({
          playerId: data.playerId,
          from: currentSpace,
          to: newPosition,
          spaces: data.diceResult.total
        });
        
        // Clear the stored result
        this.lastDiceResult = null;
        this.lastDicePlayerId = null;
      }
    });
  }

  handlePlayerMove(data) {
    console.log('=== PLAYER MOVEMENT DEBUG ===');
    console.log('Movement data:', data);
    console.log('From space:', data.from, 'To space:', data.to, 'Total spaces:', data.spaces);
    
    // Clear any pending movement timeout
    if (this.movementTimeout) {
      this.movementTimeout.remove();
      this.movementTimeout = null;
    }
    
    // Clear stored dice result since movement is happening
    this.lastDiceResult = null;
    this.lastDicePlayerId = null;
    
    const player = this.players.get(data.playerId);
    if (!player) {
      console.error('❌ Player not found for movement:', data.playerId);
      console.log('Available players:', Array.from(this.players.keys()));
      return;
    }
    
    console.log('✅ Player found:', player.name);
    
    // Get the board spaces for the path
    const fromSpace = this.board.getSpace(data.from);
    const toSpace = this.board.getSpace(data.to);
    
    console.log('From space object:', fromSpace);
    console.log('To space object:', toSpace);
    
    if (!fromSpace || !toSpace) {
      console.error('❌ Invalid space positions');
      console.log('Board has', this.board.spaces.length, 'spaces');
      return;
    }
    
    // Create movement path
    const path = [];
    const totalSpaces = data.spaces;
    
    console.log('Building path with', totalSpaces, 'spaces...');
    
    for (let i = 1; i <= totalSpaces; i++) {
      const spaceIndex = (data.from + i) % this.board.spaces.length;
      const space = this.board.getSpace(spaceIndex);
      if (space) {
        path.push(space);
        console.log(`  Step ${i}: Space ${spaceIndex} at (${space.x}, ${space.y})`);
      } else {
        console.warn(`  Step ${i}: Could not find space ${spaceIndex}`);
      }
    }
    
    console.log('✅ Path built with', path.length, 'spaces');
    
    // Animate player movement
    if (path && path.length > 0) {
      console.log('🏃 Moving player along path...');
      player.moveAlongPath(path, this.board);
    } else {
      console.log('⚡ Using fallback direct movement to target position');
      player.moveTo(toSpace.x, toSpace.y);
    }
    
    console.log('=== END MOVEMENT DEBUG ===');
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

  showSpaceEffect(x, y, color, message) {
    // Create particle effect
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.add.circle(
        x + Math.cos(angle) * 20,
        y + Math.sin(angle) * 20,
        8,
        color
      );
      particles.push(particle);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 100,
        y: y + Math.sin(angle) * 100,
        alpha: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
    
    // Show message
    const text = this.add.text(x, y - 50, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: y - 100,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  updateEnergy(data) {
    // Update the player's energy
    const player = this.players.get(data.playerId);
    if (player) {
      player.setEnergy(data.currentEnergy, data.maxEnergy);
    }
    
    // If it's the current player, update the UI
    if (data.playerId === (this.roomData?.playerId || this.playerData?.id)) {
      // Update energy bars
      const energy = data.currentEnergy || 0;
      const maxEnergy = data.maxEnergy || 5;
      
      this.uiElements.energyBars.forEach((bar, index) => {
        if (index < energy) {
          bar.setFillStyle(0xffcc00);
        } else {
          bar.setFillStyle(0x999999);
        }
      });
      
      // Update turn indicator to show energy status
      this.updateTurnIndicator();
      
      // Enable/disable roll button based on energy
      if (energy > 0) {
        this.uiElements.rollButton.setAlpha(1);
        this.uiElements.rollButton.setInteractive();
      } else {
        this.uiElements.rollButton.setAlpha(0.5);
        this.uiElements.rollButton.disableInteractive();
      }
    }
  }

  updateCoinsDisplay(coins) {
    this.uiElements.coinsText.setText(`🪙 ${coins}`);
    
    // Animate coin text
    this.tweens.add({
      targets: this.uiElements.coinsText,
      scale: { from: 1, to: 1.2 },
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
  }

  startEnergyTimer() {
    // Update energy timer every second
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const myPlayerId = this.roomData?.playerId || this.playerData?.id || 'demo-player';
        const myPlayer = this.players.get(myPlayerId);
        
        if (myPlayer && myPlayer.energy < 5) {
          // Calculate time until next energy
          const regenTime = 20; // 20 seconds in demo mode
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilNext = regenTime - (currentTime % regenTime);
          
          // Format as MM:SS
          const minutes = Math.floor(timeUntilNext / 60);
          const seconds = timeUntilNext % 60;
          const timeText = `Next: ${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          this.uiElements.energyTimer.setText(timeText);
        } else {
          this.uiElements.energyTimer.setText('Full');
        }
      },
      loop: true
    });
  }

  update(time, delta) {
    // Update players
    this.players.forEach(player => {
      if (player.update) {
        player.update(time, delta);
      }
    });
    
    // Update dice
    if (this.dice && this.dice.update) {
      this.dice.update(time, delta);
    }
  }
}