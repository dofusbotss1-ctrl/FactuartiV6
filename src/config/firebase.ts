import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';




const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDrNiFLm_jwAS6pRstetAOo3KOWkzmf8y0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "facture-bc21d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "facture-bc21d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "facture-bc21d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "15503201564",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:15503201564:web:8f61217b6e35dfbd2ad6d9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-581B5HXX2H"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;