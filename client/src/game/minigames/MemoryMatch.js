import BaseMinigame from './BaseMinigame';

export default class MemoryMatch extends BaseMinigame {
  initialize() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.canFlip = true;
    this.moves = 0;
    
    // Card emojis
    this.cardFaces = ['🍎', '🍊', '🍇', '🍓', '🍑', '🍒', '🥝', '🍋'];
    
    // Create instructions
    this.showInstructions('Match all pairs to win! Fewer moves = higher score!');
    
    // Create card grid
    this.createCardGrid();
  }

  createCardGrid() {
    const cards = [...this.cardFaces, ...this.cardFaces];
    this.shuffleArray(cards);
    
    const cols = 4;
    const rows = 4;
    const cardWidth = 70;
    const cardHeight = 70;
    const spacing = 10;
    
    const startX = (this.width - (cols * (cardWidth + spacing) - spacing)) / 2;
    const startY = 80;
    
    cards.forEach((face, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);
      
      this.createCard(x, y, cardWidth, cardHeight, face, index);
    });
    
    // Add moves counter
    this.movesText = this.scene.add.text(this.width / 2, this.height - 60, 'Moves: 0', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0.5);
    this.container.add(this.movesText);
  }

  createCard(x, y, width, height, face, index) {
    const cardContainer = this.scene.add.container(x, y);
    
    // Card back
    const cardBack = this.scene.add.rectangle(0, 0, width, height, 0x9c27b0)
      .setStrokeStyle(2, 0x7b1fa2)
      .setInteractive({ useHandCursor: true });
    
    // Card front (hidden initially)
    const cardFront = this.scene.add.rectangle(0, 0, width, height, 0xffffff)
      .setStrokeStyle(2, 0xcccccc)
      .setVisible(false);
    
    // Card face (emoji)
    const cardFace = this.scene.add.text(0, 0, face, {
      fontSize: '32px'
    }).setOrigin(0.5).setVisible(false);
    
    cardContainer.add([cardBack, cardFront, cardFace]);
    this.container.add(cardContainer);
    
    // Card data
    const card = {
      container: cardContainer,
      back: cardBack,
      front: cardFront,
      faceText: cardFace,
      face: face,
      index: index,
      isFlipped: false,
      isMatched: false
    };
    
    this.cards.push(card);
    
    // Click handler
    cardBack.on('pointerdown', () => this.flipCard(card));
    cardBack.on('pointerover', () => {
      if (!card.isFlipped && !card.isMatched) {
        });
        
        this.flippedCards = [];
        this.canFlip = true;
      });
    }
  }

  completeGame() {
    // Calculate bonus based on moves (fewer moves = higher bonus)
    const moveBonus = Math.max(0, 50 - this.moves) * 2;
    this.updateScore(moveBonus);
    
    // Victory animation
    this.cards.forEach((card, index) => {
      this.scene.time.delayedCall(index * 50, () => {
        this.scene.tweens.add({
          targets: card.container,
          y: card.container.y - 20,
          scale: 1.3,
          duration: 300,
          yoyo: true,
          ease: 'Power2'
        });
      });
    });
    
    // Show completion message
    const completeText = this.scene.add.text(this.width / 2, this.height / 2, 'Perfect!', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#4caf50',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0);
    
    this.container.add(completeText);
    
    this.scene.tweens.add({
      targets: completeText,
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

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}cardBack.setScale(1.05);
      }
    });
    cardBack.on('pointerout', () => cardBack.setScale(1));
  }

  flipCard(card) {
    if (!this.canFlip || card.isFlipped || card.isMatched) return;
    
    // Flip animation
    this.scene.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        card.back.setVisible(false);
        card.front.setVisible(true);
        card.faceText.setVisible(true);
        card.isFlipped = true;
        
        this.scene.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 150,
          onComplete: () => {
            this.flippedCards.push(card);
            
            if (this.flippedCards.length === 2) {
              this.moves++;
              this.movesText.setText(`Moves: ${this.moves}`);
              this.checkMatch();
            }
          }
        });
      }
    });
  }

  checkMatch() {
    this.canFlip = false;
    
    const [card1, card2] = this.flippedCards;
    
    if (card1.face === card2.face) {
      // Match found!
      this.matchedPairs++;
      this.updateScore(10);
      this.playSuccessSound();
      
      // Mark as matched
      card1.isMatched = true;
      card2.isMatched = true;
      
      // Celebration animation
      [card1, card2].forEach(card => {
        this.scene.tweens.add({
          targets: card.container,
          scale: 1.2,
          angle: 360,
          duration: 500,
          onComplete: () => {
            card.front.setFillStyle(0x4caf50);
          }
        });
      });
      
      this.flippedCards = [];
      this.canFlip = true;
      
      // Check if all matched
      if (this.matchedPairs === this.cardFaces.length) {
        this.completeGame();
      }
    } else {
      // No match
      this.scene.time.delayedCall(1000, () => {
        [card1, card2].forEach(card => {
          this.scene.tweens.add({
            targets: card.container,
            scaleX: 0,
            duration: 150,
            onComplete: () => {
              card.back.setVisible(true);
              card.front.setVisible(false);
              card.faceText.setVisible(false);
              card.isFlipped = false;
              
              this.scene.tweens.add({
                targets: card.container,
                scaleX: 1,
                duration: 150
              });
            }
          });
        });
        
        