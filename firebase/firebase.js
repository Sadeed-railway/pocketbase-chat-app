import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

  apiKey: "AIzaSyBnrc2q23_8FstjECVtcdIvgpxfeIFY6Ug",
  authDomain: "real-time-chat-app-c0f3e.firebaseapp.com",
  projectId: "real-time-chat-app-c0f3e",
  storageBucket: "real-time-chat-app-c0f3e.firebasestorage.app",
  messagingSenderId: "176145558751",
  appId: "1:176145558751:web:df385349648e5eecd2cd6a"
};

// Prevent duplicate app initialization during development reloads
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);