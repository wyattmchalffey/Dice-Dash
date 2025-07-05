export default class Player {
  constructor(scene, id, name, x, y, color = 0xff6b6b) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.currentSpace = 0;
    this.coins = 0;
    this.isMoving = false;
    
    this.sprite = null;
    this.nameText = null;
    this.coinText = null;
    this.initialText = null;
    
    // Create the player immediately
    this.create();
  }

  create() {
    // Create player sprite
    this.sprite = this.scene.add.circle(this.x, this.y, 20, this.color);
    this.sprite.setStrokeStyle(3, 0x000000);
    
    // Add player number or initial
    const initial = this.name.charAt(0).toUpperCase();
    this.initialText = this.scene.add.text(this.x, this.y, initial, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Create name label
    this.nameText = this.scene.add.text(this.x, this.y - 35, this.name, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);
    
    // Create coin display
    this.coinText = this.scene.add.text(this.x, this.y + 35, `🪙 ${this.coins}`, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffcc00',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);
    
    // Entrance animation
    this.sprite.setScale(0);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  moveAlongPath(path, board) {
    if (this.isMoving || path.length === 0) return;
    
    this.isMoving = true;
    
    // Create tween chain for movement
    const timeline = this.scene.tweens.createTimeline();
    
    path.forEach((space, index) => {
      timeline.add({
        targets: [this.sprite, this.nameText, this.coinText, this.initialText],
        x: space.x,
        y: {
          value: (target) => {
            if (target === this.sprite) return space.y;
            if (target === this.initialText) return space.y;
            if (target === this.nameText) return space.y - 35;
            if (target === this.coinText) return space.y + 35;
          }
        },
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.currentSpace = space.index;
          space.playLandAnimation();
          
          // Bounce effect on each space
          this.scene.tweens.add({
            targets: this.sprite,
            scale: { from: 1, to: 1.2 },
            duration: 150,
            yoyo: true
          });
        }
      });
    });
    
    timeline.on('complete', () => {
      this.isMoving = false;
      this.x = path[path.length - 1].x;
      this.y = path[path.length - 1].y;
    });
    
    timeline.play();
  }

  moveTo(x, y, duration = 500) {
    this.scene.tweens.add({
      targets: [this.sprite, this.nameText, this.coinText, this.initialText],
      x: x,
      y: {
        value: (target) => {
          if (target === this.sprite) return y;
          if (target === this.initialText) return y;
          if (target === this.nameText) return y - 35;
          if (target === this.coinText) return y + 35;
        }
      },
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.x = x;
        this.y = y;
      }
    });
  }

  updateCoins(newAmount) {
    const oldAmount = this.coins;
    this.coins = newAmount;
    
    // Animate coin change
    const diff = newAmount - oldAmount;
    if (diff !== 0) {
      // Show floating text
      const floatingText = this.scene.add.text(this.x, this.y, diff > 0 ? `+${diff}` : diff.toString(), {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: diff > 0 ? '#4caf50' : '#f44336',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      this.scene.tweens.add({
        targets: floatingText,
        y: this.y - 60,
        alpha: 0,
        duration: 1500,
        onComplete: () => floatingText.destroy()
      });
    }
    
    // Update coin display
    this.coinText.setText(`🪙 ${this.coins}`);
    
    // Pulse effect
    this.scene.tweens.add({
      targets: this.coinText,
      scale: { from: 1, to: 1.3 },
      duration: 200,
      yoyo: true
    });
  }

  setActive(active) {
    if (active) {
      // Add glow effect
      this.glowEffect = this.scene.add.circle(this.x, this.y, 30, this.color, 0.5);
      this.scene.tweens.add({
        targets: this.glowEffect,
        scale: { from: 0.8, to: 1.3 },
        alpha: { from: 0.8, to: 0.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Move glow behind sprite
      this.scene.children.moveTo(this.glowEffect, this.scene.children.getIndex(this.sprite) - 1);
    } else {
      if (this.glowEffect) {
        this.glowEffect.destroy();
        this.glowEffect = null;
      }
    }
  }

  playEmote(emoteType) {
    const emotes = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      laugh: '😂',
      think: '🤔'
    };
    
    const emote = emotes[emoteType] || '❓';
    
    const emoteText = this.scene.add.text(this.x, this.y - 50, emote, {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: emoteText,
      y: this.y - 80,
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: emoteText,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => emoteText.destroy()
          });
        });
      }
    });
  }

  update(time, delta) {
    // Update animations or states if needed
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.nameText) this.nameText.destroy();
    if (this.coinText) this.coinText.destroy();
    if (this.initialText) this.initialText.destroy();
    if (this.glowEffect) this.glowEffect.destroy();
  }
}