import { SPACE_TYPES } from '../../shared/constants/SpaceTypes';

// Predefined board layouts
export const BOARD_LAYOUTS = {
  demo: {
    name: 'Demo Board',
    size: 32,
    spaces: [
      { x: 100, y: 700, type: SPACE_TYPES.START },
      { x: 200, y: 700, type: SPACE_TYPES.BLUE },
      { x: 300, y: 700, type: SPACE_TYPES.BLUE },
      { x: 400, y: 700, type: SPACE_TYPES.MINIGAME },
      { x: 500, y: 700, type: SPACE_TYPES.BLUE },
      { x: 600, y: 700, type: SPACE_TYPES.RED },
      { x: 700, y: 700, type: SPACE_TYPES.BLUE },
      { x: 800, y: 700, type: SPACE_TYPES.EVENT },
      { x: 900, y: 700, type: SPACE_TYPES.BLUE },
      { x: 1000, y: 700, type: SPACE_TYPES.BLUE },
      { x: 1100, y: 700, type: SPACE_TYPES.STAR },
      // Right side
      { x: 1100, y: 600, type: SPACE_TYPES.BLUE },
      { x: 1100, y: 500, type: SPACE_TYPES.MINIGAME },
      { x: 1100, y: 400, type: SPACE_TYPES.RED },
      { x: 1100, y: 300, type: SPACE_TYPES.BLUE },
      { x: 1100, y: 200, type: SPACE_TYPES.EVENT },
      { x: 1100, y: 100, type: SPACE_TYPES.BLUE },
      // Top side
      { x: 1000, y: 100, type: SPACE_TYPES.BLUE },
      { x: 900, y: 100, type: SPACE_TYPES.RED },
      { x: 800, y: 100, type: SPACE_TYPES.MINIGAME },
      { x: 700, y: 100, type: SPACE_TYPES.BLUE },
      { x: 600, y: 100, type: SPACE_TYPES.BLUE },
      { x: 500, y: 100, type: SPACE_TYPES.STAR },
      { x: 400, y: 100, type: SPACE_TYPES.BLUE },
      { x: 300, y: 100, type: SPACE_TYPES.EVENT },
      { x: 200, y: 100, type: SPACE_TYPES.RED },
      { x: 100, y: 100, type: SPACE_TYPES.BLUE },
      // Left side
      { x: 100, y: 200, type: SPACE_TYPES.MINIGAME },
      { x: 100, y: 300, type: SPACE_TYPES.BLUE },
      { x: 100, y: 400, type: SPACE_TYPES.BLUE },
      { x: 100, y: 500, type: SPACE_TYPES.RED },
      { x: 100, y: 600, type: SPACE_TYPES.EVENT }
    ],
    connections: 'sequential' // spaces connect in order
  },
  
  tutorial: {
    name: 'Tutorial Island',
    size: 20,
    spaces: [
      { x: 200, y: 400, type: SPACE_TYPES.START },
      { x: 300, y: 400, type: SPACE_TYPES.BLUE },
      { x: 400, y: 400, type: SPACE_TYPES.BLUE },
      { x: 500, y: 400, type: SPACE_TYPES.MINIGAME },
      { x: 600, y: 400, type: SPACE_TYPES.BLUE },
      { x: 700, y: 400, type: SPACE_TYPES.EVENT },
      { x: 800, y: 400, type: SPACE_TYPES.BLUE },
      { x: 900, y: 400, type: SPACE_TYPES.STAR },
      { x: 1000, y: 400, type: SPACE_TYPES.BLUE },
      { x: 1000, y: 300, type: SPACE_TYPES.RED },
      { x: 900, y: 300, type: SPACE_TYPES.BLUE },
      { x: 800, y: 300, type: SPACE_TYPES.MINIGAME },
      { x: 700, y: 300, type: SPACE_TYPES.BLUE },
      { x: 600, y: 300, type: SPACE_TYPES.EVENT },
      { x: 500, y: 300, type: SPACE_TYPES.BLUE },
      { x: 400, y: 300, type: SPACE_TYPES.RED },
      { x: 300, y: 300, type: SPACE_TYPES.BLUE },
      { x: 200, y: 300, type: SPACE_TYPES.BLUE },
      { x: 200, y: 350, type: SPACE_TYPES.BLUE },
      { x: 200, y: 400, type: SPACE_TYPES.BLUE }
    ],
    connections: 'sequential'
  }
};

// Helper function to get board connections
export function getBoardConnections(layout) {
  const connections = [];
  
  if (layout.connections === 'sequential') {
    // Connect each space to the next one
    for (let i = 0; i < layout.spaces.length - 1; i++) {
      connections.push({
        from: i,
        to: i + 1
      });
    }
    // Connect last to first
    connections.push({
      from: layout.spaces.length - 1,
      to: 0
    });
  }
  
  return connections;
}

// Get board layout by name
export function getBoardLayout(boardName) {
  return BOARD_LAYOUTS[boardName] || BOARD_LAYOUTS.demo;
}