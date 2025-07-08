// Add this to your BoardScene to help debug the roll issue

export class GameDebugger {
  constructor(scene) {
    this.scene = scene;
    this.isEnabled = true; // Set to false to disable debugging
  }

  log(message, data = null) {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] GAME DEBUG: ${message}`, data || '');
    
    // Also display on screen if debug text exists
    if (this.scene.uiElements && this.scene.uiElements.debugText) {
      this.scene.uiElements.debugText.setText(`Debug: ${message}`);
    }
  }

  checkRollConditions() {
    this.log('=== CHECKING ROLL CONDITIONS ===');
    
    const conditions = {
      isMyTurn: this.scene.isMyTurn,
      diceExists: !!this.scene.dice,
      diceRolling: this.scene.dice?.isRolling,
      currentPlayerId: this.scene.currentPlayerId,
      playerDataId: this.scene.playerData?.id,
      playersCount: this.scene.players.size,
      socketConnected: this.scene.socketManager?.isConnected(),
      rollButtonExists: !!this.scene.uiElements.rollButton,
      rollButtonInteractive: this.scene.uiElements.rollButton?.input?.enabled
    };
    
    this.log('Roll conditions:', conditions);
    
    // Check for potential issues
    const issues = [];
    
    if (!conditions.isMyTurn) {
      issues.push('❌ Not player\'s turn');
    }
    
    if (!conditions.diceExists) {
      issues.push('❌ Dice object missing');
    }
    
    if (conditions.diceRolling) {
      issues.push('❌ Dice already rolling');
    }
    
    if (!conditions.currentPlayerId) {
      issues.push('❌ No current player ID set');
    }
    
    if (!conditions.rollButtonExists) {
      issues.push('❌ Roll button missing');
    }
    
    if (!conditions.rollButtonInteractive) {
      issues.push('❌ Roll button not interactive');
    }
    
    if (this.scene.players.size === 0) {
      issues.push('❌ No players in game');
    }
    
    const currentPlayer = this.scene.players.get(
      this.scene.currentPlayerId || this.scene.playerData?.id
    );
    
    if (!currentPlayer) {
      issues.push('❌ Current player object not found');
    }
    
    if (issues.length === 0) {
      this.log('✅ All roll conditions are met!');
    } else {
      this.log('❌ Issues found:', issues);
    }
    
    return { conditions, issues, canRoll: issues.length === 0 };
  }

  checkGameState() {
    this.log('=== CHECKING GAME STATE ===');
    
    const state = {
      sceneKey: this.scene.scene.key,
      sceneActive: this.scene.scene.isActive(),
      boardExists: !!this.scene.board,
      playersMap: Object.fromEntries(this.scene.players),
      currentPlayerId: this.scene.currentPlayerId,
      isMyTurn: this.scene.isMyTurn,
      roomData: this.scene.roomData,
      playerData: this.scene.playerData,
      socketManager: this.scene.socketManager ? {
        connected: this.scene.socketManager.isConnected(),
        socketId: this.scene.socketManager.getSocketId(),
        debugInfo: this.scene.socketManager.getDebugInfo()
      } : null
    };
    
    this.log('Game state:', state);
    return state;
  }

  testRoll() {
    this.log('=== TESTING ROLL FUNCTION ===');
    
    const checkResult = this.checkRollConditions();
    
    if (checkResult.canRoll) {
      this.log('✅ Conditions met, attempting roll...');
      
      try {
        this.scene.rollDice();
        this.log('✅ Roll function executed successfully');
      } catch (error) {
        this.log('❌ Error during roll:', error);
      }
    } else {
      this.log('❌ Cannot roll due to issues:', checkResult.issues);
      this.log('💡 Suggested fixes:');
      
      checkResult.issues.forEach(issue => {
        if (issue.includes('Not player\'s turn')) {
          this.log('  → Set this.scene.isMyTurn = true');
        }
        if (issue.includes('No current player ID')) {
          this.log('  → Set this.scene.currentPlayerId to a valid player ID');
        }
        if (issue.includes('Dice object missing')) {
          this.log('  → Check dice creation in createUI()');
        }
        if (issue.includes('Roll button')) {
          this.log('  → Check button creation and interactivity setup');
        }
        if (issue.includes('No players')) {
          this.log('  → Check player creation in create()');
        }
      });
    }
  }

  fixCommonIssues() {
    this.log('=== ATTEMPTING TO FIX COMMON ISSUES ===');
    
    // Fix 1: Ensure we have a current player
    if (!this.scene.currentPlayerId && this.scene.players.size > 0) {
      const firstPlayer = this.scene.players.values().next().value;
      this.scene.currentPlayerId = firstPlayer.id;
      this.scene.isMyTurn = true;
      this.log('✅ Fixed: Set current player to first available player');
    }
    
    // Fix 2: Ensure roll button is interactive
    if (this.scene.uiElements.rollButton && !this.scene.uiElements.rollButton.input?.enabled) {
      this.scene.uiElements.rollButton.setInteractive({ useHandCursor: true });
      this.log('✅ Fixed: Made roll button interactive');
    }
    
    // Fix 3: Ensure dice exists
    if (!this.scene.dice) {
      const { width, height } = this.scene.cameras.main;
      this.scene.dice = new Dice(this.scene, width / 2 - 80, height - 80);
      this.scene.dice.create();
      this.log('✅ Fixed: Created missing dice object');
    }
    
    // Fix 4: Create demo player if none exist
    if (this.scene.players.size === 0) {
      const demoPlayer = {
        id: 'debug-player',
        name: 'Debug Player',
        position: 0,
        coins: 10,
        energy: 5,
        color: 0xff6b6b
      };
      this.scene.createPlayer(demoPlayer);
      this.scene.currentPlayerId = 'debug-player';
      this.scene.isMyTurn = true;
      this.log('✅ Fixed: Created demo player');
    }
    
    this.log('=== FIX ATTEMPT COMPLETE ===');
    
    // Re-check conditions
    this.checkRollConditions();
  }

  createDebugUI() {
    if (!this.isEnabled) return;
    
    const { width, height } = this.scene.cameras.main;
    
    // Debug panel
    const debugPanel = this.scene.add.container(width - 200, 50);
    
    const bg = this.scene.add.rectangle(0, 0, 180, 200, 0x000000, 0.8);
    const title = this.scene.add.text(0, -90, 'DEBUG', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Debug buttons
    const checkButton = this.scene.add.text(0, -60, 'Check Conditions', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.checkRollConditions());
    
    const testButton = this.scene.add.text(0, -30, 'Test Roll', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffff00',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.testRoll());
    
    const fixButton = this.scene.add.text(0, 0, 'Auto Fix', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ff6600',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.fixCommonIssues());
    
    const stateButton = this.scene.add.text(0, 30, 'Check State', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#00ffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.checkGameState());
    
    const forceRollButton = this.scene.add.text(0, 60, 'Force Roll', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ff0000',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.forceRoll());
    
    debugPanel.add([bg, title, checkButton, testButton, fixButton, stateButton, forceRollButton]);
    
    this.log('✅ Debug UI created');
  }

  forceRoll() {
    this.log('=== FORCING ROLL ===');
    
    // Force all conditions to be true
    this.scene.isMyTurn = true;
    
    if (!this.scene.dice) {
      const { width, height } = this.scene.cameras.main;
      this.scene.dice = new Dice(this.scene, width / 2 - 80, height - 80);
      this.scene.dice.create();
    }
    
    this.scene.dice.isRolling = false;
    
    if (this.scene.players.size === 0) {
      this.scene.createPlayer({
        id: 'force-player',
        name: 'Force Player',
        position: 0,
        coins: 10,
        energy: 5,
        color: 0xff6b6b
      });
    }
    
    this.scene.currentPlayerId = this.scene.players.keys().next().value;
    
    this.log('Force roll - executing...');
    
    // Execute the roll directly
    const result = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = this.scene.players.get(this.scene.currentPlayerId);
    
    this.scene.handleDiceRoll({
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      diceResult: { rolls: [result], total: result }
    });
    
    this.log('✅ Force roll completed with result:', result);
  }
}

// Usage in BoardScene:
// In the create() method, add:
// this.debugger = new GameDebugger(this);
// this.debugger.createDebugUI();

// Add keyboard shortcut for quick debugging:
// this.input.keyboard.on('keydown-D', () => {
//   this.debugger.checkRollConditions();
// });

export default GameDebugger;