// src/services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
// Konfigurasi Firebase dari Environment Variables Vite
const firebaseConfig = {
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sinarpagi-db.firebaseapp.com',
projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sinarpagi-db',
storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
appId: import.meta.env.VITE_FIREBASE_APP_ID
}
// Singleton initialization untuk menghindari multiple app instances
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
// Mencegah AbortError long-polling dengan memaksa WebSockets native
const db = initializeFirestore(app, {
experimentalForceLongPolling: false,
experimentalAutoDetectLongPolling: false,
localCache: persistentLocalCache({
tabManager: persistentMultipleTabManager()
})
})
export { app, db }
