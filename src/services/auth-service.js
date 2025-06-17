// src/services/auth-service.js
import { auth } from '../config/firebase-config';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  updateProfile
} from 'firebase/auth';

export class AuthService {
  constructor() {
    this.googleProvider = new GoogleAuthProvider();
  }

  // Email/Password Sign Up
  async signUpWithEmail(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Email/Password Sign In
  async signInWithEmail(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      return await signInWithPopup(auth, this.googleProvider);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Anonymous Sign In (Guest)
  async signInAsGuest() {
    try {
      const result = await signInAnonymously(auth);
      
      // Set a random guest name
      await updateProfile(result.user, {
        displayName: `Guest_${Math.random().toString(36).substr(2, 6)}`
      });
      
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Sign Out
  async signOut() {
    try {
      return await signOut(auth);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
}