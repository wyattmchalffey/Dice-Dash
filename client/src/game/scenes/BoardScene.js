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
    this.boardType = data.boardType || 'demo';
    this.socketManager = data.socketManager;
    this.playerData = data.playerData;
    this.roomData = data.roomData;
  }

  create() {
    // Create board
    this.board = new Board(this, this.boardType);
    this.board.create();
    
    // Create dice
    this.dice = new Dice(this, this.cameras.main.centerX, this.cameras.main.height - 100);
    
    // Create UI
    this.createUI();
    
    // Create players
    if (this.roomData && this.roomData.players) {
      this.roomData.players.forEach(playerData => {
        this.createPlayer(playerData);
      });
    }
    
    // Set up socket listeners
    if (this.socketManager) {
      this.setupSocketListeners();
    }
    
    // Camera controls
    this.setupCamera();
  }

  createUI() {
    const { width, height } = this.cameras.main;
    
    // Energy display
    this.uiElements.energyContainer = this.add.container(20, 20);
    const energyBg = this.add.rectangle(0, 0, 200, 80, 0xffffff, 0.9)
      .setOrigin(0)
      .setStrokeStyle(2, 0x333333);
    
    this.uiElements.energyText = this.add.text(10, 10, 'Energy: 5/5', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    });
    
    this.uiElements.energyBars = [];
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(10 + i * 35, 40, 30, 20, 0xffcc00)
        .setOrigin(0)
        .setStrokeStyle(2, 0xff9900);
      this.uiElements.energyBars.push(bar);
    }
    
    this.uiElements.energyContainer.add([energyBg, this.uiElements.energyText, ...this.uiElements.energyBars]);
    
    // Coins display
    this.uiElements.coinsContainer = this.add.container(width - 200, 20);
    const coinsBg = this.add.rectangle(0, 0, 180, 60, 0xffffff, 0.9)
      .setOrigin(0)
      .setStrokeStyle(2, 0x333333);
    
    this.uiElements.coinsText = this.add.text(10, 15, '🪙 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ff9900',
      fontStyle: 'bold'
    });
    
    this.uiElements.coinsContainer.add([coinsBg, this.uiElements.coinsText]);
    
    // Players list
    this.uiElements.playersContainer = this.add.container(width - 200, 100);
    const playersBg = this.add.rectangle(0, 0, 180, 200, 0xffffff, 0.9)
      .setOrigin(0)
      .setStrokeStyle(2, 0x333333);
    
    this.uiElements.playersTitle = this.add.text(10, 10, 'Players', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    });
    
    this.uiElements.playersList = this.add.container(10, 40);
    this.uiElements.playersContainer.add([playersBg, this.uiElements.playersTitle, this.uiElements.playersList]);
    
    // Roll button
    this.uiElements.rollButton = this.add.image(width / 2, height - 80, 'button_red')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.rollDice())
      .on('pointerover', () => this.uiElements.rollButton.setTint(0xcccccc))
      .on('pointerout', () => this.uiElements.rollButton.clearTint());
    
    this.uiElements.rollButtonText = this.add.text(width / 2, height - 80, 'Roll Dice', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Turn indicator
    this.uiElements.turnIndicator = this.add.text(width / 2, 30, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  createPlayer(playerData) {
    const startSpace = this.board.getSpace(0);
    const player = new Player(
      this,
      playerData.id,
      playerData.name,
      startSpace.x,
      startSpace.y,
      playerData.color || 0xff6b6b
    );
    
    this.players.set(playerData.id, player);
    
    // Update players list UI
    this.updatePlayersList();
    
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

  setupSocketListeners() {
    // Player joined
    this.socketManager.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      this.createPlayer(data.player);
    });
    
    // Player left
    this.socketManager.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      const player = this.players.get(data.playerId);
      if (player) {
        player.destroy();
        this.players.delete(data.playerId);
        this.updatePlayersList();
      }
    });
    
    // Dice rolled
    this.socketManager.on(SOCKET_EVENTS.DICE_ROLLED, (data) => {
      this.handleDiceRoll(data);
    });
    
    // Player moving
    this.socketManager.on(SOCKET_EVENTS.PLAYER_MOVING, (data) => {
      this.handlePlayerMove(data);
    });
    
    // Space action
    this.socketManager.on(SOCKET_EVENTS.SPACE_ACTION, (data) => {
      this.handleSpaceAction(data);
    });
    
    // Next turn
    this.socketManager.on(SOCKET_EVENTS.NEXT_TURN, (data) => {
      this.handleNextTurn(data);
    });
    
    // Energy updated
    this.socketManager.on(SOCKET_EVENTS.ENERGY_UPDATED, (data) => {
      this.updateEnergy(data);
    });
  }

  setupCamera() {
    // Enable camera controls
    this.cameras.main.setBounds(0, 0, this.board.boardWidth, this.board.boardHeight);
    
    // Mouse wheel zoom
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        this.cameras.main.setZoom(Math.max(0.5, zoom - 0.1));
      } else {
        this.cameras.main.setZoom(Math.min(2, zoom + 0.1));
      }
    });
    
    // Drag to pan
    let dragStart = null;
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        dragStart = { x: pointer.x, y: pointer.y, scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY };
      }
    });
    
    this.input.on('pointermove', (pointer) => {
      if (dragStart && pointer.rightButtonDown()) {
        const deltaX = pointer.x - dragStart.x;
        const deltaY = pointer.y - dragStart.y;
        this.cameras.main.setScroll(dragStart.scrollX - deltaX, dragStart.scrollY - deltaY);
      }
    });
    
    this.input.on('pointerup', () => {
      dragStart = null;
    });
  }

  rollDice() {
    if (!this.isMyTurn || this.dice.isRolling) return;
    
    // Disable button
    this.uiElements.rollButton.setAlpha(0.5);
    this.uiElements.rollButton.removeInteractive();
    
    // Send roll request to server
    if (this.socketManager) {
      this.socketManager.emit(SOCKET_EVENTS.REQUEST_ROLL);
    } else {
      // Local testing
      const result = Math.floor(Math.random() * 6) + 1;
      this.handleDiceRoll({
        playerId: 'local',
        diceResult: { rolls: [result], total: result }
      });
    }
  }

  handleDiceRoll(data) {
    const player = this.players.get(data.playerId);
    if (!player) return;
    
    // Animate dice
    this.dice.roll(data.diceResult.total, () => {
      // Roll complete
    });
    
    // Show notification
    this.showNotification(`${data.playerName} rolled ${data.diceResult.total}!`);
  }

  handlePlayerMove(data) {
    const player = this.players.get(data.playerId);
    if (!player) return;
    
    // Get path from current position to target
    const path = this.board.getPath(data.from, data.to);
    
    // Animate player movement
    player.moveAlongPath(path, this.board);
  }

  handleSpaceAction(data) {
    const player = this.players.get(data.playerId);
    if (!player) return;
    
    const space = this.board.getSpace(player.currentSpace);
    const config = SPACE_CONFIG[data.spaceType];
    
    // Show space effect
    this.showSpaceEffect(space.x, space.y, config.color, data.result.message);
    
    // Update player coins
    if (data.result.coins) {
      player.updateCoins(player.coins + data.result.coins);
      if (player.id === this.playerData.id) {
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
    this.currentPlayerId = data.currentPlayer;
    this.isMyTurn = (data.currentPlayer === this.playerData.id);
    
    // Update UI
    this.updatePlayersList();
    this.updateTurnIndicator();
    
    // Enable/disable roll button
    if (this.isMyTurn) {
      this.uiElements.rollButton.setAlpha(1);
      this.uiElements.rollButton.setInteractive();
    } else {
      this.uiElements.rollButton.setAlpha(0.5);
      this.uiElements.rollButton.disableInteractive();
    }
  }

  updateEnergy(data) {
    // Update energy display
    this.uiElements.energyText.setText(`Energy: ${data.currentEnergy}/${data.maxEnergy}`);
    
    // Update energy bars
    this.uiElements.energyBars.forEach((bar, index) => {
      if (index < data.currentEnergy) {
        bar.setFillStyle(0xffcc00);
      } else {
        bar.setFillStyle(0xcccccc);
      }
    });
  }

  updateCoinsDisplay(coins) {
    this.uiElements.coinsText.setText(`🪙 ${coins}`);
  }

  updateTurnIndicator() {
    const currentPlayer = this.players.get(this.currentPlayerId);
    if (currentPlayer) {
      const text = this.isMyTurn ? 'Your Turn!' : `${currentPlayer.name}'s Turn`;
      this.uiElements.turnIndicator.setText(text);
      
      if (this.isMyTurn) {
        // Pulse animation for your turn
        this.tweens.add({
          targets: this.uiElements.turnIndicator,
          scale: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      } else {
        this.tweens.killTweensOf(this.uiElements.turnIndicator);
        this.uiElements.turnIndicator.setScale(1);
      }
    }
  }

  showNotification(message) {
    const notification = this.add.text(this.cameras.main.centerX, 100, message, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: 150,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            y: 100,
            duration: 500,
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }

  showSpaceEffect(x, y, color, message) {
    // Create effect at space position
    const effect = this.add.circle(x, y, 50, color, 0.8);
    
    this.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => effect.destroy()
    });
    
    // Show floating text
    const text = this.add.text(x, y - 30, message, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  update(time, delta) {
    // Update game objects
    this.dice.update(time, delta);
    
    this.players.forEach(player => {
      player.update(time, delta);
    });
  }
}