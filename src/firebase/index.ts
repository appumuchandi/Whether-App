
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  try {
    // Basic validation: ensure API key is present and doesn't look like a placeholder
    const isValidConfig = 
      firebaseConfig.apiKey && 
      firebaseConfig.apiKey !== 'undefined' && 
      !firebaseConfig.apiKey.includes('placeholder');

    if (!isValidConfig) {
      console.warn("Firebase: Invalid or missing API Key. Please check your environment variables.");
      return { app: null, auth: null, firestore: null };
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    
    return { app, auth, firestore };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { app: null, auth: null, firestore: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
