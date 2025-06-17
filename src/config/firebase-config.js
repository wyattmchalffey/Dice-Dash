// src/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// TODO: Replace with YOUR actual config from Firebase Console
// Go to: Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
    apiKey: "AIzaSyBtJC7VqMOIkhEtGNLbEU5fOI-EgAkSu-M",
    authDomain: "dice-dash-d0d5a.firebaseapp.com",
    projectId: "dice-dash-d0d5a",
    storageBucket: "dice-dash-d0d5a.firebasestorage.app",
    messagingSenderId: "183096677466",
    appId: "1:183096677466:web:a1fc89a1ce263d26e4b463",
    measurementId: "G-KMJWB0896R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;