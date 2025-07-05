import Phaser from 'phaser';
import MemoryMatch from '../minigames/MemoryMatch';
import FruitSlash from '../minigames/FruitSlash';
import QuickTap from '../minigames/QuickTap';
import { SOCKET_EVENTS } from '../../shared/constants/Events';

export default class MinigameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MinigameScene' });
    this.currentMinigame = null;
    this.playerId = null;
    this.socketManager = null;
  }

  init(data) {
    this.playerId = data.playerId;
    this.minigameType = data.minigameType;
    this.socketManager = data.socketManager;
  }

  create() {
    // Semi-transparent background
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8)
      .setOrigin(0);
    
    // Create minigame container
    const containerWidth = 800;
    const containerHeight = 600;
    const containerX = (this.cameras.main.width - containerWidth) / 2;
    const containerY = (this.cameras.main.height - containerHeight) / 2;
    
    // Background panel
    this.add.rectangle(containerX, containerY, containerWidth, containerHeight, 0xffffff)
      .setOrigin(0)
      .setStrokeStyle(4, 0x333333);
    
    // Title
    const title = this.getMinigameTitle(this.minigameType);
    this.add.text(this.cameras.main.centerX, containerY + 40, title, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Timer
    this.timerText = this.add.text(this.cameras.main.centerX, containerY + 80, 'Time: 30', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ff6b6b'
    }).setOrigin(0.5);
    
    // Create minigame
    this.createMinigame(containerX + 50, containerY + 120, containerWidth - 100, containerHeight - 200);
    
    // Skip button (costs coins)
    this.createSkipButton(this.cameras.main.centerX, containerY + containerHeight - 40);
    
    // Start timer
    this.startTimer(30);
  }

  getMinigameTitle(type) {
    const titles = {
      'memory_match': 'Memory Match!',
      'fruit_slash': 'Fruit Slash!',
      'quick_tap': 'Quick Tap!'
    };
    return titles[type] || 'Minigame!';
  }

  createMinigame(x, y, width, height) {
    switch (this.minigameType) {
      case 'memory_match':
        this.currentMinigame = new MemoryMatch(this, x, y, width, height);
        break;
      case 'fruit_slash':
        this.currentMinigame = new FruitSlash(this, x, y, width, height);
        break;
      case 'quick_tap':
        this.currentMinigame = new QuickTap(this, x, y, width, height);
        break;
      default:
        console.error('Unknown minigame type:', this.minigameType);
        this.endMinigame(false, 0);
        return;
    }
    
    this.currentMinigame.create();
    this.currentMinigame.on('complete', (score) => {
      this.endMinigame(true, score);
    });
  }

  createSkipButton(x, y) {
    const button = this.add.rectangle(x, y, 200, 50, 0xf44336)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => button.setFillStyle(0xe53935))
      .on('pointerout', () => button.setFillStyle(0xf44336))
      .on('pointerdown', () => {
        this.endMinigame(false, 0);
      });
    
    this.add.text(x, y, 'Skip (-5 coins)', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  startTimer(duration) {
    this.timeRemaining = duration;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        this.timerText.setText(`Time: ${this.timeRemaining}`);
        
        if (this.timeRemaining <= 0) {
          this.endMinigame(false, 0);
        }
      },
      loop: true
    });
  }

  endMinigame(completed, score) {
    // Stop timer
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
    
    // Clean up minigame
    if (this.currentMinigame) {
      this.currentMinigame.destroy();
    }
    
    // Send result to server
    if (this.socketManager) {
      this.socketManager.emit(SOCKET_EVENTS.MINIGAME_RESULT, {
        completed: completed,
        score: score,
        timeElapsed: (30 - this.timeRemaining) * 1000
      });
    }
    
    // Show result
    this.showResult(completed, score);
    
    // Return to board after delay
    this.time.delayedCall(2000, () => {
      this.scene.stop('MinigameScene');
      this.scene.resume('BoardScene');
    });
  }

  showResult(completed, score) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    // Result background
    const resultBg = this.add.rectangle(centerX, centerY, 400, 200, 0x000000, 0.9)
      .setStrokeStyle(4, 0xffffff);
    
    // Result text
    const resultText = completed ? 'Success!' : 'Time\'s Up!';
    const resultColor = completed ? '#4caf50' : '#f44336';
    
    this.add.text(centerX, centerY - 40, resultText, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Score text
    if (completed) {
      this.add.text(centerX, centerY + 20, `Score: ${score}`, {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.add.text(centerX, centerY + 60, '+10 coins!', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffcc00'
      }).setOrigin(0.5);
    }
  }

  update(time, delta) {
    if (this.currentMinigame && this.currentMinigame.update) {
      this.currentMinigame.update(time, delta);
    }
  }
}