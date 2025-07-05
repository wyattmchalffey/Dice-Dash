// API client for REST endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export class GameAPI {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add session ID if available
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Authentication endpoints
  static async login(playerName) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ playerName })
    });
  }
  
  static async validateSession(sessionId) {
    return this.request('/auth/validate', {
      headers: { 'X-Session-Id': sessionId }
    });
  }
  
  static async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }
  
  static async getLeaderboard() {
    return this.request('/auth/leaderboard');
  }
  
  // Game endpoints
  static async getRooms() {
    return this.request('/game/rooms');
  }
  
  static async getRoomDetails(roomId) {
    return this.request(`/game/rooms/${roomId}`);
  }
  
  static async getPlayerStats() {
    return this.request('/game/stats');
  }
  
  static async getShopItems() {
    return this.request('/game/shop');
  }
  
  static async purchaseItem(itemId) {
    return this.request('/game/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  }
  
  static async getDailyChallenges() {
    return this.request('/game/challenges');
  }
  
  static async sendFeedback(type, message) {
    return this.request('/game/feedback', {
      method: 'POST',
      body: JSON.stringify({
        type,
        message,
        userAgent: navigator.userAgent
      })
    });
  }
}