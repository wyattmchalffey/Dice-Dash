export default class Dice {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isRolling = false;
    this.currentValue = 1;
    this.diceSprite = null;
  }

  create() {
    // Create dice sprite
    this.diceSprite = this.scene.add.image(this.x, this.y, 'dice_1');
    this.diceSprite.setScale(1.5);
  }

  roll(finalValue, callback) {
    if (this.isRolling) return;
    
    this.isRolling = true;
    let rollCount = 0;
    const maxRolls = 15;
    
    // Rolling animation
    const rollTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        rollCount++;
        
        // Show random dice face
        const randomValue = Math.floor(Math.random() * 6) + 1;
        this.diceSprite.setTexture(`dice_${randomValue}`);
        
        // Add rotation
        this.diceSprite.rotation += 0.3;
        
        // Slow down near the end
        if (rollCount > maxRolls - 5) {
          rollTimer.delay = 100 + (rollCount - (maxRolls - 5)) * 50;
        }
        
        if (rollCount >= maxRolls) {
          // Show final value
          this.currentValue = finalValue;
          this.diceSprite.setTexture(`dice_${finalValue}`);
          this.diceSprite.rotation = 0;
          
          // Bounce effect
          this.scene.tweens.add({
            targets: this.diceSprite,
            scale: { from: 1.5, to: 2 },
            duration: 200,
            yoyo: true,
            ease: 'Power2',
            onComplete: () => {
              this.isRolling = false;
              if (callback) callback();
            }
          });
          
          rollTimer.remove();
        }
      },
      loop: true
    });
    
    // Add some juice to the animation
    this.scene.tweens.add({
      targets: this.diceSprite,
      y: this.y - 20,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  getValue() {
    return this.currentValue;
  }

  update(time, delta) {
    // Update dice animations if needed
  }
}