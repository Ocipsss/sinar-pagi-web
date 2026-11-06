import { supabase } from './supabase.js'

const QRIS_CACHE_KEY = 'sinar_pagi_qris_cache'
const QRIS_CACHE_TIME_KEY = 'sinar_pagi_qris_cache_time'
const QRIS_CACHE_DURATION = 60 * 60 * 1000 // 1 jam cache

export const qrisService = {
  async fetchRemoteSettings() {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem(QRIS_CACHE_KEY)
        if (cached) return JSON.parse(cached)
      } catch {}
      return null
    }

    // Hemat request API: Cek cache dulu
    try {
      const lastCache = Number(localStorage.getItem(QRIS_CACHE_TIME_KEY) || 0)
      const now = Date.now()
      if (lastCache && (now - lastCache < QRIS_CACHE_DURATION)) {
        const cached = localStorage.getItem(QRIS_CACHE_KEY)
        if (cached) {
          return JSON.parse(cached)
        }
      }
    } catch {}

    try {
      // 1. Coba cari setting khusus id = 'qris'
      let { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'qris')
        .maybeSingle()

      // 2. Fallback jika tersimpan di id = 'default_settings'
      if (!data) {
        const fallbackRes = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .maybeSingle()
        data = fallbackRes.data
      }

      if (data) {
        const result = {
          id: data.id || 'qris',
          qrisUrl: data.qris_url || data.qrisUrl || data.image_url || '',
          merchantName: data.merchant_name || data.merchantName || 'WARUNG SINAR PAGI',
          nmid: data.nmid || '',
          updatedAt: data.updated_at || new Date().toISOString()
        }

        try {
          localStorage.setItem(QRIS_CACHE_KEY, JSON.stringify(result))
          localStorage.setItem(QRIS_CACHE_TIME_KEY, String(Date.now()))
        } catch {}

        return result
      }
    } catch (error) {
      console.error('[QrisService] Error fetch QRIS:', error)
      try {
        const cached = localStorage.getItem(QRIS_CACHE_KEY)
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return null
  }
}
