import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Database, getDatabase } from "firebase/database";
import { FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCaD5-ZR2cl91tohEVuNcRErK-pZYlY_SE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "puja26-5d19a.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://puja26-5d19a-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "puja26-5d19a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "puja26-5d19a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "797849505599",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:797849505599:web:1a90a169242bfd0df4cd8a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-FSPQHMRFL8",
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey);

function clientApp(): FirebaseApp | undefined {
  if (typeof window === "undefined" || !firebaseConfigured) return undefined;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const app = clientApp();
export const auth: Auth | undefined = app ? getAuth(app) : undefined;
export const db: Firestore | undefined = app ? getFirestore(app) : undefined;
export const realtimeDb: Database | undefined = app ? getDatabase(app) : undefined;
export const storage: FirebaseStorage | undefined = app ? getStorage(app) : undefined;

/** Analytics is deliberately lazy because it is unavailable during SSR and some browsers. */
export async function initializeAnalytics() {
  if (!app || typeof window === "undefined") return undefined;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(app) : undefined;
}
