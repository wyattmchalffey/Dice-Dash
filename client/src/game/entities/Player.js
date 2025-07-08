import { SOCKET_EVENTS } from '../../shared/constants/Events.js';

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
    // Create player sprite (smaller size)
    this.sprite = this.scene.add.circle(this.x, this.y, 16, this.color);
    this.sprite.setStrokeStyle(2, 0x000000);
    
    // Add player number or initial
    const initial = this.name.charAt(0).toUpperCase();
    this.initialText = this.scene.add.text(this.x, this.y, initial, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Create name label
    this.nameText = this.scene.add.text(this.x, this.y - 28, this.name, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    // Create coin display
    this.coinText = this.scene.add.text(this.x, this.y + 28, `🪙 ${this.coins}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffcc00',
      backgroundColor: '#333333',
      padding: { x: 4, y: 2 }
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

  moveTo(targetX, targetY, callback) {
    if (this.isMoving) return;
    
    this.isMoving = true;
    
    // Update position
    this.x = targetX;
    this.y = targetY;
    
    // Animate all player elements to the new position
    this.scene.tweens.add({
      targets: [this.sprite, this.nameText, this.coinText, this.initialText],
      x: targetX,
      y: {
        value: (target) => {
          if (target === this.sprite) return targetY;
          if (target === this.initialText) return targetY;
          if (target === this.nameText) return targetY - 28;
          if (target === this.coinText) return targetY + 28;
        }
      },
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        if (callback) callback();
      }
    });
  }

  moveAlongPath(path, board) {
    if (this.isMoving || path.length === 0) return;
    
    this.isMoving = true;
    
    // Move through each space in sequence
    let currentIndex = 0;
    
    const moveToNextSpace = () => {
      if (currentIndex >= path.length) {
        // Movement complete
        this.isMoving = false;
        
        // Emit movement complete event
        if (this.scene.socketManager && typeof this.scene.socketManager.emit === 'function') {
          this.scene.socketManager.emit(SOCKET_EVENTS.PLAYER_MOVED, {
            playerId: this.id,
            position: this.currentSpace
          });
        }
        return;
      }
      
      const space = path[currentIndex];
      this.currentSpace = space.index;
      
      // Update position
      this.x = space.x;
      this.y = space.y;
      
      // Animate to the space
      this.scene.tweens.add({
        targets: [this.sprite, this.nameText, this.coinText, this.initialText],
        x: space.x,
        y: {
          value: (target) => {
            if (target === this.sprite) return space.y;
            if (target === this.initialText) return space.y;
            if (target === this.nameText) return space.y - 28;
            if (target === this.coinText) return space.y + 28;
          }
        },
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          // Play land animation
          if (space.playLandAnimation) {
            space.playLandAnimation();
          }
          
          // Move to next space
          currentIndex++;
          moveToNextSpace();
        }
      });
    };
    
    // Start movement
    moveToNextSpace();
  }

  updateCoins(amount) {
    this.coins = amount;
    this.coinText.setText(`🪙 ${this.coins}`);
    
    // Coin update animation
    this.scene.tweens.add({
      targets: this.coinText,
      scale: { from: 1, to: 1.2 },
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
  }

  highlight(enabled = true) {
    if (enabled) {
      this.sprite.setStrokeStyle(4, 0xffff00);
    } else {
      this.sprite.setStrokeStyle(2, 0x000000);
    }
  }

  setEnergy(current, max) {
    // Store energy values if needed
    this.energy = current;
    this.maxEnergy = max;
  }

  playEmote(emoteType) {
    // Create emote bubble above player
    const emote = this.scene.add.text(this.x, this.y - 50, emoteType, {
      fontSize: '24px',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Animate emote
    this.scene.tweens.add({
      targets: emote,
      y: this.y - 70,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      onComplete: () => emote.destroy()
    });
  }

  destroy() {
    // Clean up all game objects
    if (this.sprite) this.sprite.destroy();
    if (this.nameText) this.nameText.destroy();
    if (this.coinText) this.coinText.destroy();
    if (this.initialText) this.initialText.destroy();
  }

  update(time, delta) {
    // Update method for any per-frame logic if needed
  }
}