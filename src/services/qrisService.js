// src/services/qrisService.js
import { doc, getDoc } from 'firebase/firestore'
import { db as firestoreDb } from './firebase.js'
import { db as dexieDb } from '../db/index.js'

/**
 * Service untuk mengambil dan menyimpan konfigurasi QRIS secara aman.
 * Mencegah pemalsuan QRIS (tampering) dengan mengambil data langsung dari Firestore collection `settings/qris`.
 */
export const qrisService = {
  /**
   * Mengambil pengaturan QRIS dari Firestore dan memperbarui cache lokal di IndexedDB.
   * Mengembalikan objek fallback jika offline atau data belum diset.
   * 
   * @returns {Promise<{ qrisUrl: string, merchantName: string, nmid: string }>}
   */
  async getQrisSettings() {
    try {
      if (navigator.onLine) {
        const docRef = doc(firestoreDb, 'settings', 'qris')
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const qrisData = {
            id: 'qris',
            qrisUrl: data.qrisUrl || '',
            merchantName: data.merchantName || 'SINAR PAGI',
            nmid: data.nmid || '',
            updatedAt: data.updatedAt || new Date().toISOString()
          }

          // Update cache IndexedDB lokal
          await dexieDb.settings.put(qrisData)
          return qrisData
        }
      }

      // Fallback ke IndexedDB jika offline atau dokumen Firestore tidak ditemukan
      const localQris = await dexieDb.settings.get('qris')
      if (localQris) {
        return localQris
      }

      return {
        qrisUrl: '',
        merchantName: 'SINAR PAGI',
        nmid: ''
      }
    } catch (error) {
      console.error('[QrisService] Error fetching QRIS settings:', error)
      const localQris = await dexieDb.settings.get('qris')
      return (
        localQris || {
          qrisUrl: '',
          merchantName: 'SINAR PAGI',
          nmid: ''
        }
      )
    }
  }
}
