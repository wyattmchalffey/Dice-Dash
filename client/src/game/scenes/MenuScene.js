import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Background
    this.add.rectangle(0, 0, width, height, 0x87ceeb).setOrigin(0);
    
    // Title
    this.add.text(width / 2, 100, 'Dice Dash', {
      fontSize: '72px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    // Menu buttons
    const buttonY = height / 2;
    const buttonSpacing = 80;
    
    // Play button
    this.createButton(width / 2, buttonY, 'Play Game', () => {
      this.scene.start('BoardScene');
    });
    
    // Tutorial button
    this.createButton(width / 2, buttonY + buttonSpacing, 'Tutorial', () => {
      this.scene.start('BoardScene', { boardType: 'tutorial' });
    });
    
    // Settings button
    this.createButton(width / 2, buttonY + buttonSpacing * 2, 'Settings', () => {
      console.log('Settings clicked');
    });
    
    // Credits
    this.add.text(width / 2, height - 50, 'Created for Dice Dash Demo', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
  
  createButton(x, y, text, callback) {
    const button = this.add.image(x, y, 'button_red')
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => button.setTint(0xcccccc))
      .on('pointerout', () => button.clearTint())
      .on('pointerdown', () => button.setScale(0.95))
      .on('pointerup', () => {
        button.setScale(1);
        callback();
      });
    
    this.add.text(x, y, text, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    return button;
  }
}