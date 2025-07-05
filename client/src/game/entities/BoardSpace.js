import { SPACE_CONFIG } from '../../shared/constants/SpaceTypes';

export default class BoardSpace {
  constructor(scene, index, x, y, type) {
    this.scene = scene;
    this.index = index;
    this.x = x;
    this.y = y;
    this.type = type;
    this.graphics = null;
    this.icon = null;
    this.highlightGraphics = null;
  }

  create() {
    const config = SPACE_CONFIG[this.type];
    
    // Create space graphic
    this.graphics = this.scene.add.circle(this.x, this.y, 35, config.color);
    this.graphics.setStrokeStyle(3, 0x333333);
    
    // Add space icon/text
    this.icon = this.scene.add.text(this.x, this.y, config.icon, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add space number (for debugging)
    if (this.index > 0) { // Don't show on START space
      this.scene.add.text(this.x, this.y + 45, this.index.toString(), {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#666666'
      }).setOrigin(0.5);
    }
    
    // Make interactive for hover effects
    this.graphics.setInteractive({ useHandCursor: false });
    this.graphics.on('pointerover', () => this.onHover());
    this.graphics.on('pointerout', () => this.onHoverEnd());
  }

  onHover() {
    // Show space info tooltip
    const config = SPACE_CONFIG[this.type];
    
    if (!this.tooltip) {
      this.tooltip = this.scene.add.container(this.x, this.y - 70);
      
      const bg = this.scene.add.rectangle(0, 0, 150, 40, 0x000000, 0.8)
        .setStrokeStyle(1, 0xffffff);
      
      const text = this.scene.add.text(0, 0, config.description, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      
      this.tooltip.add([bg, text]);
    }
    
    this.tooltip.setVisible(true);
  }

  onHoverEnd() {
    if (this.tooltip) {
      this.tooltip.setVisible(false);
    }
  }

  highlight() {
    if (!this.highlightGraphics) {
      this.highlightGraphics = this.scene.add.circle(this.x, this.y, 45, 0xffff00, 0.5);
      this.scene.tweens.add({
        targets: this.highlightGraphics,
        scale: { from: 0.8, to: 1.2 },
        alpha: { from: 0.8, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    }
  }

  unhighlight() {
    if (this.highlightGraphics) {
      this.highlightGraphics.destroy();
      this.highlightGraphics = null;
    }
  }

  playLandAnimation() {
    // Bounce effect when player lands
    this.scene.tweens.add({
      targets: this.graphics,
      scale: { from: 1, to: 1.3 },
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
    
    // Particle effect
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.x + Math.cos(angle) * 20,
        this.y + Math.sin(angle) * 20,
        5,
        SPACE_CONFIG[this.type].color
      );
      particles.push(particle);
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 60,
        y: this.y + Math.sin(angle) * 60,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  destroy() {
    if (this.graphics) this.graphics.destroy();
    if (this.icon) this.icon.destroy();
    if (this.highlightGraphics) this.highlightGraphics.destroy();
    if (this.tooltip) this.tooltip.destroy();
  }
}