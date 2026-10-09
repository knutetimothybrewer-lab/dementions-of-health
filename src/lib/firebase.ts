import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  waitForPendingWrites,
} from 'firebase/firestore'
import { useSync } from '@/stores/sync'

const env = import.meta.env

export const ORG_ID: string = env.VITE_ORG_ID || 'top-tier'
const useEmulators = env.VITE_USE_EMULATORS === 'true'

/** Without a configured project we fall back to a demo project that only works against emulators. */
export const isConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-top-tier.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-top-tier',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || 'demo-app',
})

export const auth = getAuth(app)

// IndexedDB persistence, shared across tabs. Queued writes survive restarts.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (useEmulators || !isConfigured) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

/** Wire browser connectivity + restored-queue tracking into the sync store. Call once at startup. */
export function startSyncMonitoring(): void {
  const { setOnline, setRestoring } = useSync.getState()
  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))
  setOnline(navigator.onLine)
  setRestoring(true)
  void waitForPendingWrites(db)
    .catch(() => undefined)
    .finally(() => setRestoring(false))
}
