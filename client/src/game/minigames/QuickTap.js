import BaseMinigame from './BaseMinigame';

export default class QuickTap extends BaseMinigame {
  initialize() {
    this.targets = [];
    this.activeTarget = null;
    this.missedTargets = 0;
    this.maxMisses = 3;
    this.targetSpeed = 1500; // Start with 1.5 seconds per target
    
    // Create miss counter
    this.missText = this.scene.add.text(20, 20, `Misses: 0/${this.maxMisses}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#f44336',
      fontStyle: 'bold'
    });
    this.container.add(this.missText);
    
    // Create speed indicator
    this.speedText = this.scene.add.text(this.width - 20, 20, 'Speed: 1x', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#2196f3',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.container.add(this.speedText);
    
    // Instructions
    this.showInstructions('Tap the targets before they disappear! Speed increases over time!');
    
    // Start spawning targets
    this.startGame();
  }

  startGame() {
    // Spawn first target after a short delay
    this.scene.time.delayedCall(1000, () => {
      this.spawnTarget();
    });
  }

  spawnTarget() {
    if (this.isComplete) return;
    
    // Remove active target if exists (missed)
    if (this.activeTarget && this.activeTarget.active) {
      this.missTarget();
    }
    
    // Calculate random position (with padding)
    const padding = 60;
    const x = Math.random() * (this.width - padding * 2) + padding;
    const y = Math.random() * (this.height - padding * 2 - 100) + padding + 50;
    
    // Create target
    const targetContainer = this.scene.add.container(x, y);
    
    // Outer ring
    const outerRing = this.scene.add.circle(0, 0, 40, 0xff6b6b);
    const middleRing = this.scene.add.circle(0, 0, 30, 0xffffff);
    const innerRing = this.scene.add.circle(0, 0, 20, 0xff6b6b);
    const centerDot = this.scene.add.circle(0, 0, 10, 0xffffff);
    
    targetContainer.add([outerRing, middleRing, innerRing, centerDot]);
    this.container.add(targetContainer);
    
    // Make interactive
    outerRing.setInteractive({ useHandCursor: true });
    outerRing.on('pointerdown', () => this.hitTarget(targetContainer));
    
    // Spawn animation
    targetContainer.setScale(0);
    this.scene.tweens.add({
      targets: targetContainer,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
    
    // Timer ring
    const timerRing = this.scene.add.graphics();
    targetContainer.add(timerRing);
    
    // Countdown animation
    const countdown = this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: this.targetSpeed,
      onUpdate: (tween) => {
        const progress = tween.getValue();
        timerRing.clear();
        timerRing.lineStyle(4, 0x333333, 0.5);
        timerRing.beginPath();
        timerRing.arc(0, 0, 45, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        timerRing.strokePath();
      },
      onComplete: () => {
        if (targetContainer.active) {
          this.missTarget();
        }
      }
    });
    
    this.activeTarget = targetContainer;
    this.activeTarget.countdown = countdown;
  }

  hitTarget(target) {
    if (!target.active || target !== this.activeTarget) return;
    
    // Stop countdown
    if (target.countdown) {
      target.countdown.stop();
    }
    
    // Calculate points based on remaining time
    const timeRemaining = 1 - (target.countdown ? target.countdown.progress : 0);
    const points = Math.floor(10 + timeRemaining * 20);
    
    this.updateScore(points);
    this.playSuccessSound();
    
    // Hit animation
    this.scene.tweens.add({
      targets: target,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        target.destroy();
      }
    });
    
    // Create hit effect
    this.createHitEffect(target.x, target.y);
    
    // Clear active target
    this.activeTarget = null;
    
    // Increase speed every 5 hits
    if (this.score > 0 && this.score % 50 === 0) {
      this.increaseSpeed();
    }
    
    // Spawn next target
    this.scene.time.delayedCall(500, () => {
      this.spawnTarget();
    });
  }

  missTarget() {
    if (!this.activeTarget) return;
    
    this.missedTargets++;
    this.missText.setText(`Misses: ${this.missedTargets}/${this.maxMisses}`);
    
    // Miss animation
    this.scene.tweens.add({
      targets: this.activeTarget,
      scale: 0,
      rotation: Math.PI,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (this.activeTarget) {
          this.activeTarget.destroy();
        }
      }
    });
    
    // Shake effect
    this.shake();
    this.playFailureSound();
    
    // Clear active target
    this.activeTarget = null;
    
    // Check game over
    if (this.missedTargets >= this.maxMisses) {
      this.gameOver();
    } else {
      // Spawn next target
      this.scene.time.delayedCall(1000, () => {
        this.spawnTarget();
      });
    }
  }

  increaseSpeed() {
    this.targetSpeed = Math.max(500, this.targetSpeed * 0.9); // Minimum 0.5 seconds
    const speedMultiplier = (1500 / this.targetSpeed).toFixed(1);
    this.speedText.setText(`Speed: ${speedMultiplier}x`);
    
    // Flash speed text
    this.scene.tweens.add({
      targets: this.speedText,
      scale: 1.5,
      duration: 200,
      yoyo: true
    });
  }

  createHitEffect(x, y) {
    // Create expanding rings
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, 20, 0x4caf50, 0);
      ring.setStrokeStyle(3, 0x4caf50);
      this.container.add(ring);
      
      this.scene.tweens.add({
        targets: ring,
        scale: 2 + i * 0.5,
        alpha: 0,
        duration: 500 + i * 100,
        onComplete: () => ring.destroy()
      });
    }
  }

  gameOver() {
    this.isComplete = true;
    
    // Stop any active target
    if (this.activeTarget) {
      if (this.activeTarget.countdown) {
        this.activeTarget.countdown.stop();
      }
      this.activeTarget.destroy();
    }
    
    // Show game over
    const gameOverText = this.scene.add.text(this.width / 2, this.height / 2, 'Game Over!', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#f44336',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0);
    
    this.container.add(gameOverText);
    
    this.scene.tweens.add({
      targets: gameOverText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(1000, () => {
          this.complete();
        });
      }
    });
  }

  destroy() {
    if (this.activeTarget) {
      if (this.activeTarget.countdown) {
        this.activeTarget.countdown.stop();
      }
      this.activeTarget.destroy();
    }
    
    super.destroy();
  }
}