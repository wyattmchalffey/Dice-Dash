// src/systems/BoardManager.js
export class BoardManager {
    constructor(board) {
        this.board = board;
        this.playerPositions = new Map();
        this.spaceOccupancy = new Map();
        this.activeEffects = new Map();
    }

    // Initialize player at starting position
    initializePlayer(playerId, startPosition = 0) {
        this.playerPositions.set(playerId, startPosition);
        this.updateSpaceOccupancy(playerId, null, startPosition);
    }

    // Update player position
    updatePlayerPosition(playerId, newPosition) {
        const oldPosition = this.playerPositions.get(playerId);
        this.playerPositions.set(playerId, newPosition);
        this.updateSpaceOccupancy(playerId, oldPosition, newPosition);
    }

    // Track which players are on which spaces
    updateSpaceOccupancy(playerId, oldSpaceId, newSpaceId) {
        // Remove from old space
        if (oldSpaceId !== null && oldSpaceId !== undefined) {
            const oldOccupants = this.spaceOccupancy.get(oldSpaceId) || new Set();
            oldOccupants.delete(playerId);
            if (oldOccupants.size === 0) {
                this.spaceOccupancy.delete(oldSpaceId);
            } else {
                this.spaceOccupancy.set(oldSpaceId, oldOccupants);
            }
        }

        // Add to new space
        if (newSpaceId !== null && newSpaceId !== undefined) {
            const newOccupants = this.spaceOccupancy.get(newSpaceId) || new Set();
            newOccupants.add(playerId);
            this.spaceOccupancy.set(newSpaceId, newOccupants);
        }
    }

    // Get all players on a specific space
    getPlayersOnSpace(spaceId) {
        return Array.from(this.spaceOccupancy.get(spaceId) || new Set());
    }

    // Get valid moves for a player based on dice roll
    getValidMoves(playerId, diceRoll) {
        const currentPosition = this.playerPositions.get(playerId);
        if (currentPosition === undefined) return [];

        const currentSpace = this.board.spaces.find(s => s.id === currentPosition);
        if (!currentSpace) return [];

        // Find all spaces within dice roll distance
        const validMoves = [];
        const visited = new Set();
        const queue = [{ space: currentSpace, distance: 0, path: [currentSpace.id] }];

        while (queue.length > 0) {
            const { space, distance, path } = queue.shift();
            
            if (distance === diceRoll) {
                validMoves.push({
                    spaceId: space.id,
                    path: path
                });
                continue;
            }

            // Check all connected spaces
            space.connections.forEach(connectionId => {
                if (!visited.has(connectionId)) {
                    visited.add(connectionId);
                    const connectedSpace = this.board.spaces.find(s => s.id === connectionId);
                    if (connectedSpace) {
                        queue.push({
                            space: connectedSpace,
                            distance: distance + 1,
                            path: [...path, connectionId]
                        });
                    }
                }
            });
        }

        return validMoves;
    }

    // Get spaces visible in viewport for rendering optimization
    getViewportSpaces(centerX, centerY, radius) {
        return this.board.spaces.filter(space => {
            const dx = Math.abs(space.x - centerX);
            const dy = Math.abs(space.y - centerY);
            return dx <= radius && dy <= radius;
        });
    }

    // Apply space effect when player lands
    applySpaceEffect(playerId, spaceId) {
        const space = this.board.spaces.find(s => s.id === spaceId);
        if (!space) return null;

        const spaceType = space.type.toUpperCase();
        const effects = {
            BLUE: { coins: 3, message: 'Gained 3 coins!' },
            RED: { coins: -3, message: 'Lost 3 coins!' },
            EVENT: { event: true, message: 'Event triggered!' },
            MINIGAME: { minigame: true, message: 'Minigame time!' },
            SHOP: { shop: true, message: 'Welcome to the shop!' },
            STAR: { star: true, message: 'A star is here!' },
            WARP: { warp: true, message: 'Warping to another location!' }
        };

        return effects[spaceType] || { message: 'Nothing happened.' };
    }

    // Get board state for saving/loading
    getBoardState() {
        return {
            playerPositions: Object.fromEntries(this.playerPositions),
            spaceOccupancy: Object.fromEntries(
                Array.from(this.spaceOccupancy.entries()).map(([key, value]) => [key, Array.from(value)])
            ),
            activeEffects: Object.fromEntries(this.activeEffects)
        };
    }

    // Restore board state
    restoreBoardState(state) {
        this.playerPositions = new Map(Object.entries(state.playerPositions || {}));
        this.spaceOccupancy = new Map(
            Object.entries(state.spaceOccupancy || {}).map(([key, value]) => [key, new Set(value)])
        );
        this.activeEffects = new Map(Object.entries(state.activeEffects || {}));
    }
}