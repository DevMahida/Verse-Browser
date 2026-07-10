import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1bQvGLPcBRuqKfMVXie252vItXqB4zT8",
  authDomain: "verse-ai-browser.firebaseapp.com",
  projectId: "verse-ai-browser",
  storageBucket: "verse-ai-browser.firebasestorage.app",
  messagingSenderId: "277052452776",
  appId: "1:277052452776:web:d9ee6f12846f278467379d",
  measurementId: "G-W4YG0FDMJM"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
