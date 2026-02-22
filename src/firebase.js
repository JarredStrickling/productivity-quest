import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Use initializeAuth with explicit persistence instead of getAuth()
// to avoid Vite persistence bug (firebase-js-sdk Issue #8626).
// browserSessionPersistence = auth clears when tab/browser closes (login required each visit).
export const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
});

export const db = getFirestore(app);
