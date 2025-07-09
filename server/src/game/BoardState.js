// server/src/game/BoardState.js
import { SPACE_TYPES } from '../../../shared/constants/SpaceTypes.js';

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
    // Demo board - 32 spaces
    const spaces = [];
    
    // Create a simple square board layout
    const positions = [
      // Bottom row (left to right)
      { x: 100, y: 500 }, { x: 175, y: 500 }, { x: 250, y: 500 }, { x: 325, y: 500 },
      { x: 400, y: 500 }, { x: 475, y: 500 }, { x: 550, y: 500 }, { x: 625, y: 500 },
      // Right column (bottom to top)
      { x: 700, y: 500 }, { x: 700, y: 425 }, { x: 700, y: 350 }, { x: 700, y: 275 },
      { x: 700, y: 200 }, { x: 700, y: 125 }, { x: 700, y: 50 },
      // Top row (right to left)
      { x: 625, y: 50 }, { x: 550, y: 50 }, { x: 475, y: 50 }, { x: 400, y: 50 },
      { x: 325, y: 50 }, { x: 250, y: 50 }, { x: 175, y: 50 }, { x: 100, y: 50 },
      // Left column (top to bottom)
      { x: 100, y: 125 }, { x: 100, y: 200 }, { x: 100, y: 275 }, { x: 100, y: 350 },
      { x: 100, y: 425 },
      // Inner spaces
      { x: 275, y: 275 }, { x: 400, y: 275 }, { x: 525, y: 275 }
    ];

    // Assign space types
    const spaceTypes = [
      SPACE_TYPES.START,      // 0
      SPACE_TYPES.BLUE,       // 1
      SPACE_TYPES.BLUE,       // 2
      SPACE_TYPES.RED,        // 3
      SPACE_TYPES.MINIGAME,   // 4
      SPACE_TYPES.BLUE,       // 5
      SPACE_TYPES.EVENT,      // 6
      SPACE_TYPES.BLUE,       // 7
      SPACE_TYPES.BLUE,       // 8
      SPACE_TYPES.RED,        // 9
      SPACE_TYPES.STAR,       // 10
      SPACE_TYPES.BLUE,       // 11
      SPACE_TYPES.MINIGAME,   // 12
      SPACE_TYPES.BLUE,       // 13
      SPACE_TYPES.EVENT,      // 14
      SPACE_TYPES.BLUE,       // 15
      SPACE_TYPES.RED,        // 16
      SPACE_TYPES.BLUE,       // 17
      SPACE_TYPES.MINIGAME,   // 18
      SPACE_TYPES.BLUE,       // 19
      SPACE_TYPES.BLUE,       // 20
      SPACE_TYPES.EVENT,      // 21
      SPACE_TYPES.STAR,       // 22
      SPACE_TYPES.BLUE,       // 23
      SPACE_TYPES.RED,        // 24
      SPACE_TYPES.BLUE,       // 25
      SPACE_TYPES.MINIGAME,   // 26
      SPACE_TYPES.BLUE,       // 27
      SPACE_TYPES.SHOP,       // 28
      SPACE_TYPES.BLUE,       // 29
      SPACE_TYPES.EVENT,      // 30
      SPACE_TYPES.BLUE        // 31
    ];

    // Create space objects
    for (let i = 0; i < positions.length && i < spaceTypes.length; i++) {
      spaces.push({
        id: i,
        type: spaceTypes[i],
        x: positions[i].x,
        y: positions[i].y,
        connections: [] // Will be set later if needed
      });
    }

    return spaces;
  }

  // Initialize special spaces (stars, warps, etc.)
  initializeSpecialSpaces() {
    // Find and track star spaces
    this.spaces.forEach((space, index) => {
      if (space.type === SPACE_TYPES.STAR) {
        this.starPositions.add(index);
      }
    });
  }

  // Get space at specific position
  getSpace(position) {
    if (position < 0 || position >= this.spaces.length) {
      return null;
    }
    return this.spaces[position];
  }

  // Calculate new position after moving
  calculateNewPosition(currentPosition, spacesToMove) {
    // Simple circular board movement
    return (currentPosition + spacesToMove) % this.boardSize;
  }

  // Get starting position
  getStartPosition() {
    // Find START space
    for (let i = 0; i < this.spaces.length; i++) {
      if (this.spaces[i].type === SPACE_TYPES.START) {
        return i;
      }
    }
    return 0; // Default to first space
  }

  // Get all star positions
  getStarPositions() {
    return Array.from(this.starPositions);
  }

  // Find nearest star from position
  findNearestStar(position) {
    let nearestStar = -1;
    let minDistance = this.boardSize;

    for (const starPos of this.starPositions) {
      const distance = Math.min(
        Math.abs(starPos - position),
        this.boardSize - Math.abs(starPos - position)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestStar = starPos;
      }
    }

    return nearestStar;
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