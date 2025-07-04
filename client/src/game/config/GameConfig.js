import Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import MenuScene from '../scenes/MenuScene';
import BoardScene from '../scenes/BoardScene';
import MinigameScene from '../scenes/MinigameScene';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1200,
  height: 800,
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, MenuScene, BoardScene, MinigameScene]
};

// Game constants for client
export const GAME_CONSTANTS = {
  TILE_SIZE: 70,
  PLAYER_SIZE: 40,
  ANIMATION_SPEED: 300,
  DICE_ROLL_TIME: 1000,
  NOTIFICATION_DURATION: 2000
};

// Asset paths
export const ASSETS = {
  images: {
    board: 'assets/sprites/board.png',
    dice: 'assets/sprites/dice.png',
    spaces: 'assets/sprites/spaces.png',
    players: 'assets/sprites/players.png',
    coins: 'assets/sprites/coins.png'
  },
  audio: {
    diceRoll: 'assets/audio/dice_roll.mp3',
    coinCollect: 'assets/audio/coin_collect.mp3',
    move: 'assets/audio/move.mp3',
    minigameStart: 'assets/audio/minigame_start.mp3',
    win: 'assets/audio/win.mp3',
    lose: 'assets/audio/lose.mp3'
  }
};