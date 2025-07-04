import Phaser from 'phaser';

export default class BaseMinigame extends Phaser.Events.EventEmitter {
  constructor(scene, x, y, width, height) {
    super();
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.score = 0;
    this.isComplete = false;
    this.container = null;
  }

  create() {
    // Create container for minigame elements
    this.container = this.scene.add.container(this.x, this.y);
    
    // Add background
    const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xf0f0f0)
      .setOrigin(0)
      .setStrokeStyle(2, 0xcccccc);
    this.container.add(bg);
    
    // Add score display
    this.scoreText = this.scene.add.text(this.width / 2, 20, 'Score: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.scoreText);
    
    // Initialize specific minigame
    this.initialize();
  }

  initialize() {
    // Override in subclasses
    console.warn('BaseMinigame.initialize() should be overridden');
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
    
    // Score popup animation
    const popup = this.scene.add.text(
      this.width / 2,
      this.height / 2,
      `+${points}`,
      {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: '#4caf50',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    this.container.add(popup);
    
    this.scene.tweens.add({
      targets: popup,
      y: popup.y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      onComplete: () => popup.destroy()
    });
  }

  complete() {
    if (this.isComplete) return;
    
    this.isComplete = true;
    this.emit('complete', this.score);
  }

  showInstructions(text) {
    const instructions = this.scene.add.text(this.width / 2, this.height - 30, text, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#666666',
      align: 'center',
      wordWrap: { width: this.width - 40 }
    }).setOrigin(0.5);
    
    this.container.add(instructions);
  }

  createButton(x, y, text, callback) {
    const button = this.scene.add.rectangle(x, y, 120, 40, 0x2196f3)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => button.setFillStyle(0x1976d2))
      .on('pointerout', () => button.setFillStyle(0x2196f3))
      .on('pointerdown', callback);
    
    const buttonText = this.scene.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.container.add([button, buttonText]);
    
    return { button, text: buttonText };
  }

  shake() {
    this.scene.cameras.main.shake(200, 0.01);
  }

  playSuccessSound() {
    // In a real implementation, play success sound
    console.log('Success sound!');
  }

  playFailureSound() {
    // In a real implementation, play failure sound
    console.log('Failure sound!');
  }

  update(time, delta) {
    // Override in subclasses if needed
  }

  destroy() {
    if (this.container) {
      this.container.destroy(true);
    }
    this.removeAllListeners();
  }
}