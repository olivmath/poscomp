import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const placeholderApiKey = 'dummy-key-for-emulator';

if (import.meta.env.MODE === 'production' && (!apiKey || apiKey === placeholderApiKey)) {
  console.error('Firebase API key missing or invalid for production. Set VITE_FIREBASE_API_KEY in your deployment environment.');
  throw new Error('Missing/invalid Firebase API key in production');
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'us-central1')
export const storage = getStorage(app)

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  const emulatorHost = import.meta.env.VITE_EMULATOR_HOST ?? '127.0.0.1'
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, emulatorHost, 8080)
  connectFunctionsEmulator(functions, emulatorHost, 5001)
  connectStorageEmulator(storage, emulatorHost, 9199)
}
