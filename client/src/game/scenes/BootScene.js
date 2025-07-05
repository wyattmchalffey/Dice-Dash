import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px Arial',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px Arial',
        fill: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    // Update progress bar
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });
    
    // Clean up when complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    // Load assets
    this.loadAssets();
  }

  loadAssets() {
    // Since we're using a web demo, we'll create assets programmatically
    // In a real game, you would load actual image and audio files here
    
    // Create colored square textures for spaces
    this.createColoredTexture('space_blue', 0x2196f3);
    this.createColoredTexture('space_red', 0xf44336);
    this.createColoredTexture('space_green', 0x4caf50);
    this.createColoredTexture('space_purple', 0x9c27b0);
    this.createColoredTexture('space_yellow', 0xffc107);
    this.createColoredTexture('space_gold', 0xffd700);
    
    // Create player token textures
    this.createPlayerTexture('player_red', 0xff6b6b);
    this.createPlayerTexture('player_blue', 0x4ecdc4);
    this.createPlayerTexture('player_green', 0x45b7d1);
    this.createPlayerTexture('player_yellow', 0xf9ca24);
    
    // Create dice texture
    this.createDiceTextures();
    
    // Create UI elements
    this.createUITextures();
  }

  createColoredTexture(key, color) {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 1);
    graphics.fillCircle(35, 35, 35);
    graphics.lineStyle(3, 0x333333, 1);
    graphics.strokeCircle(35, 35, 35);
    graphics.generateTexture(key, 70, 70);
    graphics.destroy();
  }

  createPlayerTexture(key, color) {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 1);
    graphics.fillCircle(20, 20, 20);
    graphics.lineStyle(3, 0x000000, 1);
    graphics.strokeCircle(20, 20, 20);
    graphics.generateTexture(key, 40, 40);
    graphics.destroy();
  }

  createDiceTextures() {
    for (let i = 1; i <= 6; i++) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      
      // Dice background
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRoundedRect(0, 0, 60, 60, 10);
      graphics.lineStyle(3, 0x333333, 1);
      graphics.strokeRoundedRect(0, 0, 60, 60, 10);
      
      // Dice dots
      graphics.fillStyle(0x333333, 1);
      const dotPositions = this.getDotPositions(i);
      dotPositions.forEach(pos => {
        graphics.fillCircle(pos.x, pos.y, 6);
      });
      
      graphics.generateTexture(`dice_${i}`, 60, 60);
      graphics.destroy();
    }
  }

  getDotPositions(value) {
    const positions = [];
    const center = 30;
    const offset = 15;
    
    switch (value) {
      case 1:
        positions.push({ x: center, y: center });
        break;
      case 2:
        positions.push({ x: center - offset, y: center - offset });
        positions.push({ x: center + offset, y: center + offset });
        break;
      case 3:
        positions.push({ x: center - offset, y: center - offset });
        positions.push({ x: center, y: center });
        positions.push({ x: center + offset, y: center + offset });
        break;
      case 4:
        positions.push({ x: center - offset, y: center - offset });
        positions.push({ x: center + offset, y: center - offset });
        positions.push({ x: center - offset, y: center + offset });
        positions.push({ x: center + offset, y: center + offset });
        break;
      case 5:
        positions.push({ x: center - offset, y: center - offset });
        positions.push({ x: center + offset, y: center - offset });
        positions.push({ x: center, y: center });
        positions.push({ x: center - offset, y: center + offset });
        positions.push({ x: center + offset, y: center + offset });
        break;
      case 6:
        positions.push({ x: center - offset, y: center - offset });
        positions.push({ x: center + offset, y: center - offset });
        positions.push({ x: center - offset, y: center });
        positions.push({ x: center + offset, y: center });
        positions.push({ x: center - offset, y: center + offset });
        positions.push({ x: center + offset, y: center + offset });
        break;
    }
    
    return positions;
  }

  createUITextures() {
    // Create button texture
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xff6b6b, 1);
    graphics.fillRoundedRect(0, 0, 200, 60, 30);
    graphics.generateTexture('button_red', 200, 60);
    
    graphics.clear();
    graphics.fillStyle(0x4ecdc4, 1);
    graphics.fillRoundedRect(0, 0, 200, 60, 30);
    graphics.generateTexture('button_blue', 200, 60);
    
    graphics.destroy();
  }

  create() {
    // Check if we should go directly to board (when joining from GameView)
    if (this.scene.settings.data && this.scene.settings.data.skipMenu) {
      this.scene.start('BoardScene', this.scene.settings.data);
      return;
    }
    
    // Otherwise show the title screen
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'Dice Dash', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Add start instruction
    const startText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Click to Start', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Blink animation
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });
    
    // Click to continue
    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}