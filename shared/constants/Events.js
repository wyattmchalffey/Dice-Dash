// Socket.io event names
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  ERROR: 'error',
  
  // Game flow events
  JOIN_GAME: 'join_game',
  LEAVE_GAME: 'leave_game',
  GAME_JOINED: 'game_joined',
  GAME_STATE_UPDATE: 'game_state_update',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  
  // Turn events
  REQUEST_ROLL: 'request_roll',
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVING: 'player_moving',
  PLAYER_MOVED: 'player_moved',
  SPACE_ACTION: 'space_action',
  TURN_ENDED: 'turn_ended',
  NEXT_TURN: 'next_turn',
  
  // Minigame events
  MINIGAME_START: 'minigame_start',
  MINIGAME_ACTION: 'minigame_action',
  MINIGAME_RESULT: 'minigame_result',
  MINIGAME_ENDED: 'minigame_ended',
  
  // Energy events
  ENERGY_UPDATED: 'energy_updated',
  ENERGY_REGENERATED: 'energy_regenerated',
  ENERGY_PURCHASED: 'energy_purchased',
  
  // Currency events
  COINS_UPDATED: 'coins_updated',
  GEMS_UPDATED: 'gems_updated',
  PURCHASE_MADE: 'purchase_made',
  
  // Social events
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  CHAT_MESSAGE: 'chat_message',
  EMOTE_SENT: 'emote_sent',
  
  // Error events
  INVALID_ACTION: 'invalid_action',
  NOT_YOUR_TURN: 'not_your_turn',
  INSUFFICIENT_ENERGY: 'insufficient_energy',
  GAME_FULL: 'game_full'
};

// Client to server action types
export const ACTION_TYPES = {
  ROLL_DICE: 'roll_dice',
  END_TURN: 'end_turn',
  USE_ITEM: 'use_item',
  PURCHASE_ENERGY: 'purchase_energy',
  SEND_EMOTE: 'send_emote',
  SKIP_MINIGAME: 'skip_minigame'
};

// Server to client response types
export const RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};