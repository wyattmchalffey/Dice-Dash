import { getBoardLayout, getBoardConnections } from '../config/BoardLayouts';
import BoardSpace from './BoardSpace';

export default class Board {
  constructor(scene, boardType = 'demo') {
    this.scene = scene;
    this.boardType = boardType;
    this.spaces = [];
    this.connections = [];
    this.boardWidth = 900;  // Reduced to leave space for UI
    this.boardHeight = 600; // Reduced to leave space for UI
    this.offsetX = 150;     // Offset from left edge
    this.offsetY = 100;     // Offset from top edge
  }

  create() {
    // Get board layout
    const layout = getBoardLayout(this.boardType);
    
    // Create background
    this.createBackground();
    
    // Create connections first (so they appear under spaces)
    this.createConnections(layout);
    
    // Create spaces
    this.createSpaces(layout);
  }

  createBackground() {
    // Board background
    const bg = this.scene.add.rectangle(
      this.offsetX + this.boardWidth / 2,
      this.offsetY + this.boardHeight / 2,
      this.boardWidth - 50,
      this.boardHeight - 50,
      0xffffff,
      0.3
    );
    bg.setStrokeStyle(4, 0x333333);
    
    // Add decorative elements
    this.addDecorations();
  }

  addDecorations() {
    // Add some decorative circles in corners
    const corners = [
      { x: this.offsetX + 50, y: this.offsetY + 50 },
      { x: this.offsetX + this.boardWidth - 50, y: this.offsetY + 50 },
      { x: this.offsetX + 50, y: this.offsetY + this.boardHeight - 50 },
      { x: this.offsetX + this.boardWidth - 50, y: this.offsetY + this.boardHeight - 50 }
    ];
    
    corners.forEach(corner => {
      this.scene.add.circle(corner.x, corner.y, 40, 0x667eea, 0.2)
        .setStrokeStyle(2, 0x667eea, 0.5);
    });
    
    // Add board title
    this.scene.add.text(this.scene.cameras.main.centerX, this.offsetY - 30, getBoardLayout(this.boardType).name, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createConnections(layout) {
    const connections = getBoardConnections(layout);
    
    connections.forEach(connection => {
      const fromSpace = this.adjustSpacePosition(layout.spaces[connection.from]);
      const toSpace = this.adjustSpacePosition(layout.spaces[connection.to]);
      
      const line = this.scene.add.line(
        0, 0,
        fromSpace.x, fromSpace.y,
        toSpace.x, toSpace.y,
        0x666666, 0.5
      );
      line.setLineWidth(2);
      
      this.connections.push(line);
    });
  }

  createSpaces(layout) {
    layout.spaces.forEach((spaceData, index) => {
      const adjustedSpace = this.adjustSpacePosition(spaceData);
      const space = new BoardSpace(
        this.scene,
        index,
        adjustedSpace.x,
        adjustedSpace.y,
        spaceData.type
      );
      space.create();
      this.spaces.push(space);
    });
  }

  adjustSpacePosition(spaceData) {
    // Scale and offset the space positions to fit within the board area
    const scaleX = 0.75;
    const scaleY = 0.75;
    
    return {
      x: this.offsetX + (spaceData.x - 100) * scaleX + 50,
      y: this.offsetY + (spaceData.y - 100) * scaleY + 50,
      type: spaceData.type
    };
  }

  getSpace(index) {
    return this.spaces[index];
  }

  getPath(fromIndex, toIndex) {
    const path = [];
    let current = fromIndex;
    
    while (current !== toIndex) {
      current = (current + 1) % this.spaces.length;
      path.push(this.spaces[current]);
    }
    
    return path;
  }

  highlightSpace(index) {
    const space = this.spaces[index];
    if (space) {
      space.highlight();
    }
  }

  unhighlightAll() {
    this.spaces.forEach(space => space.unhighlight());
  }

  getSpacePosition(index) {
    const space = this.spaces[index];
    return space ? { x: space.x, y: space.y } : null;
  }
}