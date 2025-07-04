import BaseMinigame from './BaseMinigame';

export default class FruitSlash extends BaseMinigame {
  initialize() {
    this.fruits = [];
    this.slashGraphics = null;
    this.combo = 0;
    this.maxCombo = 0;
    
    // Fruit types
    this.fruitTypes = [
      { emoji: '🍎', points: 10, speed: 300 },
      { emoji: '🍊', points: 15, speed: 350 },
      { emoji: '🍇', points: 20, speed: 400 },
      { emoji: '🍓', points: 25, speed: 450 },
      { emoji: '🍑', points: 30, speed: 500 }
    ];
    
    // Create slash graphics
    this.slashGraphics = this.scene.add.graphics();
    this.container.add(this.slashGraphics);
    
    // Create combo display
    this.comboText = this.scene.add.text(20, 20, 'Combo: 0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ff6b6b',
      fontStyle: 'bold'
    });
    this.container.add(this.comboText);
    
    // Instructions
    this.showInstructions('Swipe to slice the fruits! Build combos for bonus points!');
    
    // Start spawning fruits
    this.startSpawning();
    
    // Set up input
    this.setupInput();
  }

  startSpawning() {
    this.spawnTimer = this.scene.time.addEvent({
      delay: 800,
      callback: () => this.spawnFruit(),
      loop: true
    });
    
    // Spawn first fruit immediately
    this.spawnFruit();
  }

  spawnFruit() {
    const fruitType = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
    const startX = Math.random() * (this.width - 100) + 50;
    const startY = this.height + 50;
    
    const fruit = this.scene.add.text(startX, startY, fruitType.emoji, {
      fontSize: '48px'
    }).setOrigin(0.5);
    
    // Add physics-like properties
    fruit.velocityX = (Math.random() - 0.5) * 200;
    fruit.velocityY = -fruitType.speed - Math.random() * 100;
    fruit.gravity = 400;
    fruit.points = fruitType.points;
    fruit.isSliced = false;
    fruit.rotation = 0;
    fruit.rotationSpeed = (Math.random() - 0.5) * 5;
    
    this.container.add(fruit);
    this.fruits.push(fruit);
  }

  setupInput() {
    let isDrawing = false;
    let lastPointer = null;
    
    this.scene.input.on('pointerdown', (pointer) => {
      if (this.isWithinBounds(pointer)) {
        isDrawing = true;
        lastPointer = { x: pointer.x - this.x, y: pointer.y - this.y };
        this.slashGraphics.clear();
      }
    });
    
    this.scene.input.on('pointermove', (pointer) => {
      if (isDrawing && this.isWithinBounds(pointer)) {
        const currentX = pointer.x - this.x;
        const currentY = pointer.y - this.y;
        
        // Draw slash trail
        this.slashGraphics.lineStyle(4, 0xffffff, 0.8);
        this.slashGraphics.lineBetween(lastPointer.x, lastPointer.y, currentX, currentY);
        
        // Check for fruit collision
        this.checkSlash(lastPointer.x, lastPointer.y, currentX, currentY);
        
        lastPointer = { x: currentX, y: currentY };
      }
    });
    
    this.scene.input.on('pointerup', () => {
      isDrawing = false;
      // Fade out slash trail
      this.scene.tweens.add({
        targets: this.slashGraphics,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.slashGraphics.clear();
          this.slashGraphics.alpha = 1;
        }
      });
    });
  }

  isWithinBounds(pointer) {
    return pointer.x >= this.x && pointer.x <= this.x + this.width &&
           pointer.y >= this.y && pointer.y <= this.y + this.height;
  }

  checkSlash(x1, y1, x2, y2) {
    this.fruits.forEach(fruit => {
      if (!fruit.isSliced && fruit.active) {
        const fruitX = fruit.x - this.x;
        const fruitY = fruit.y - this.y;
        
        // Simple line-circle collision
        const dist = this.pointToLineDistance(fruitX, fruitY, x1, y1, x2, y2);
        
        if (dist < 30) {
          this.sliceFruit(fruit);
        }
      }
    });
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  sliceFruit(fruit) {
    fruit.isSliced = true;
    
    // Update score and combo
    this.combo++;
    const points = fruit.points + (this.combo - 1) * 5;
    this.updateScore(points);
    
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    this.comboText.setText(`Combo: x${this.combo}`);
    
    // Slice animation
    this.scene.tweens.add({
      targets: fruit,
      scale: 1.5,
      alpha: 0,
      x: fruit.x + fruit.velocityX * 0.5,
      y: fruit.y - 50,
      rotation: Math.PI * 2,
      duration: 500,
      onComplete: () => {
        fruit.destroy();
        const index = this.fruits.indexOf(fruit);
        if (index > -1) {
          this.fruits.splice(index, 1);
        }
      }
    });
    
    // Juice effect
    this.createJuiceEffect(fruit.x - this.x, fruit.y - this.y);
    
    // Play sound
    this.playSuccessSound();
  }

  createJuiceEffect(x, y) {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 100 + Math.random() * 100;
      
      const particle = this.scene.add.circle(
        x,
        y,
        Math.random() * 4 + 2,
        0xff6b6b,
        0.8
      );
      
      this.container.add(particle);
      particles.push(particle);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 50,
        alpha: 0,
        duration: 600,
        onComplete: () => particle.destroy()
      });
    }
  }

  update(time, delta) {
    // Update fruit positions
    const deltaSeconds = delta / 1000;
    
    this.fruits.forEach(fruit => {
      if (!fruit.isSliced && fruit.active) {
        // Apply physics
        fruit.velocityY += fruit.gravity * deltaSeconds;
        fruit.x += fruit.velocityX * deltaSeconds;
        fruit.y += fruit.velocityY * deltaSeconds;
        fruit.rotation += fruit.rotationSpeed * deltaSeconds;
        
        // Remove if off screen
        if (fruit.y > this.height + 100) {
          // Missed fruit - reset combo
          if (this.combo > 0) {
            this.combo = 0;
            this.comboText.setText('Combo: 0');
            this.shake();
          }
          
          fruit.destroy();
          const index = this.fruits.indexOf(fruit);
          if (index > -1) {
            this.fruits.splice(index, 1);
          }
        }
      }
    });
  }

  destroy() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
    
    this.fruits.forEach(fruit => fruit.destroy());
    this.fruits = [];
    
    super.destroy();
  }
}