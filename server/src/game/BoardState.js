import { SPACE_TYPES } from '../../../shared/constants/SpaceTypes.js';
import { calculateNewPosition } from '../../../shared/utils/GameLogic.js';

export class BoardState {
  constructor() {
    this.spaces = this.generateBoard();
    this.boardSize = this.spaces.length;
    this.starPositions = new Set();
    this.warpPairs = new Map();
    
    this.initializeSpecialSpaces();
  }

  // Generate the board layout
  generateBoard() {
    // Predesigned board for demo - 32 spaces
    const layout = [
      { type: SPACE_TYPES.START, x: 100, y: 700 },
      { type: SPACE_TYPES.BLUE, x: 200, y: 700 },
      { type: SPACE_TYPES.BLUE, x: 300, y: 700 },
      { type: SPACE_TYPES.MINIGAME, x: 400, y: 700 },
      { type: SPACE_TYPES.BLUE, x: 500, y: 700 },
      { type: SPACE_TYPES.RED, x: 600, y: 700 },
      { type: SPACE_TYPES.BLUE, x: 700, y: 700 },
      { type: SPACE_TYPES.EVENT, x: 800, y: 700 },
      { type: SPACE_TYPES.BLUE, x: 900, y: 700 },
      { type: SPACE_TYPES.BLUE, x: 1000, y: 700 },
      { type: SPACE_TYPES.STAR, x: 1100, y: 700 },
      // Right side
      { type: SPACE_TYPES.BLUE, x: 1100, y: 600 },
      { type: SPACE_TYPES.MINIGAME, x: 1100, y: 500 },
      { type: SPACE_TYPES.RED, x: 1100, y: 400 },
      { type: SPACE_TYPES.BLUE, x: 1100, y: 300 },
      { type: SPACE_TYPES.EVENT, x: 1100, y: 200 },
      { type: SPACE_TYPES.BLUE, x: 1100, y: 100 },
      // Top side
      { type: SPACE_TYPES.BLUE, x: 1000, y: 100 },
      { type: SPACE_TYPES.RED, x: 900, y: 100 },
      { type: SPACE_TYPES.MINIGAME, x: 800, y: 100 },
      { type: SPACE_TYPES.BLUE, x: 700, y: 100 },
      { type: SPACE_TYPES.BLUE, x: 600, y: 100 },
      { type: SPACE_TYPES.STAR, x: 500, y: 100 },
      { type: SPACE_TYPES.BLUE, x: 400, y: 100 },
      { type: SPACE_TYPES.EVENT, x: 300, y: 100 },
      { type: SPACE_TYPES.RED, x: 200, y: 100 },
      { type: SPACE_TYPES.BLUE, x: 100, y: 100 },
      // Left side
      { type: SPACE_TYPES.MINIGAME, x: 100, y: 200 },
      { type: SPACE_TYPES.BLUE, x: 100, y: 300 },
      { type: SPACE_TYPES.BLUE, x: 100, y: 400 },
      { type: SPACE_TYPES.RED, x: 100, y: 500 },
      { type: SPACE_TYPES.EVENT, x: 100, y: 600 }
    ];
    
    return layout.map((space, index) => ({
      id: index,
      ...space
    }));
  }

  // Initialize special spaces (stars, warps)
  initializeSpecialSpaces() {
    // Find star spaces
    this.spaces.forEach((space, index) => {
      if (space.type === SPACE_TYPES.STAR) {
        this.starPositions.add(index);
      }
    });
    
    // Set up warp pairs (for future implementation)
    // Example: space 5 warps to space 15
    // this.warpPairs.set(5, 15);
    // this.warpPairs.set(15, 5);
  }

  // Get a specific space
  getSpace(position) {
    if (position < 0 || position >= this.boardSize) {
      return null;
    }
    return this.spaces[position];
  }

  // Calculate new position after moving
  calculateNewPosition(currentPosition, spacesToMove) {
    return calculateNewPosition(currentPosition, spacesToMove, this.boardSize);
  }

  // Get start position
  getStartPosition() {
    return 0; // Always start at position 0
  }

  // Get random space of specific type
  getRandomSpaceOfType(type) {
    const spacesOfType = this.spaces.filter(space => space.type === type);
    if (spacesOfType.length === 0) return null;
    
    return spacesOfType[Math.floor(Math.random() * spacesOfType.length)];
  }

  // Get nearest space of type from position
  getNearestSpaceOfType(position, type, direction = 'forward') {
    let currentPos = position;
    
    for (let i = 0; i < this.boardSize; i++) {
      if (direction === 'forward') {
        currentPos = (currentPos + 1) % this.boardSize;
      } else {
        currentPos = (currentPos - 1 + this.boardSize) % this.boardSize;
      }
      
      if (this.spaces[currentPos].type === type) {
        return currentPos;
      }
    }
    
    return -1; // Not found
  }

  // Move star to new position after collection
  moveStarSpace(oldPosition) {
    // Remove from old position
    this.starPositions.delete(oldPosition);
    this.spaces[oldPosition].type = SPACE_TYPES.BLUE;
    
    // Find new position (avoid occupied special spaces)
    let newPosition;
    let attempts = 0;
    
    do {
      newPosition = Math.floor(Math.random() * this.boardSize);
      attempts++;
    } while (
      (this.spaces[newPosition].type !== SPACE_TYPES.BLUE || 
       newPosition === 0) && // Don't place on start
      attempts < 100
    );
    
    // Update new position
    if (attempts < 100) {
      this.spaces[newPosition].type = SPACE_TYPES.STAR;
      this.starPositions.add(newPosition);
      
      return newPosition;
    }
    
    return -1; // Failed to place
  }

  // Get board data for client
  getBoardData() {
    return {
      spaces: this.spaces.map(space => ({
        id: space.id,
        type: space.type,
        x: space.x,
        y: space.y
      })),
      size: this.boardSize,
      starPositions: Array.from(this.starPositions)
    };
  }

  // Check if position is valid
  isValidPosition(position) {
    return position >= 0 && position < this.boardSize;
  }

  // Get path between two positions
  getPath(from, to) {
    const path = [];
    let current = from;
    
    while (current !== to) {
      current = (current + 1) % this.boardSize;
      path.push(current);
    }
    
    return path;
  }

  // Get spaces in range
  getSpacesInRange(position, range) {
    const spaces = [];
    
    for (let i = 1; i <= range; i++) {
      const forward = (position + i) % this.boardSize;
      const backward = (position - i + this.boardSize) % this.boardSize;
      
      spaces.push(this.spaces[forward]);
      if (forward !== backward) {
        spaces.push(this.spaces[backward]);
      }
    }
    
    return spaces;
  }
}