import { doc, getDoc } from 'firebase/firestore'
import { db as firestoreDb } from './firebase.js'

const QRIS_CACHE_KEY = 'sinar_pagi_qris_cache'
const QRIS_CACHE_TIME_KEY = 'sinar_pagi_qris_cache_time'
const QRIS_CACHE_DURATION = 60 * 60 * 1000 // 1 jam - QRIS jarang ganti

export const qrisService = {
  async fetchRemoteSettings() {
    if (!navigator.onLine) {
      // offline - coba ambil cache
      try {
        const cached = localStorage.getItem(QRIS_CACHE_KEY)
        if (cached) return JSON.parse(cached)
      } catch {}
      return null
    }

    // HEMAT KUOTA: cek cache dulu
    try {
      const lastCache = Number(localStorage.getItem(QRIS_CACHE_TIME_KEY) || 0)
      const now = Date.now()
      if (lastCache && (now - lastCache < QRIS_CACHE_DURATION)) {
        const cached = localStorage.getItem(QRIS_CACHE_KEY)
        if (cached) {
          console.log('[QrisService] Cache hit - pake lokal, hemat 1 read')
          return JSON.parse(cached)
        }
      }
    } catch {}

    try {
      const docRef = doc(firestoreDb, 'settings', 'qris')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const result = {
          id: 'qris',
          qrisUrl: data.qrisUrl || '',
          merchantName: data.merchantName || 'WARUNG SINAR PAGI',
          nmid: data.nmid || '',
          updatedAt: data.updatedAt || new Date().toISOString()
        }
        // simpan cache
        try {
          localStorage.setItem(QRIS_CACHE_KEY, JSON.stringify(result))
          localStorage.setItem(QRIS_CACHE_TIME_KEY, String(Date.now()))
        } catch {}
        return result
      }
    } catch (error) {
      console.error('[QrisService] Error:', error)
      // kalo error, fallback ke cache
      try {
        const cached = localStorage.getItem(QRIS_CACHE_KEY)
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return null
  }
}