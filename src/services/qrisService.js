import { doc, getDoc } from 'firebase/firestore'
import { db as firestoreDb } from './firebase.js'

export const qrisService = {
  async fetchRemoteSettings() {
    if (!navigator.onLine) return null
    try {
      const docRef = doc(firestoreDb, 'settings', 'qris')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: 'qris',
          qrisUrl: data.qrisUrl || '',
          merchantName: data.merchantName || 'WARUNG SINAR PAGI',
          nmid: data.nmid || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('[QrisService] Error:', error)
    }
    return null
  }
}
