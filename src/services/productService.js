import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db as firestoreDb } from './firebase.js'
import { productRepo } from '../db/repositories/productRepository.js'
import { db } from '../db/index.js'

const getServiceIds = (s) => {
  if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
  if (s.productId) return [s.productId]
  return []
}

const VERSION_KEY = 'sinar_pagi_catalog_version'
const LAST_SYNC_KEY = 'sinar_pagi_last_sync'

export const productService = {
  async syncPublishedProducts() {
    try {
      if (!navigator.onLine) {
        return await productRepo.getPublished()
      }

      // VERSI EKSTRIM: cek 1 dokumen meta/catalog dulu (cuma 1 read)
      let remoteVersion = null
      try {
        const metaRef = doc(firestoreDb, 'meta', 'catalog')
        const metaSnap = await getDoc(metaRef)
        if (metaSnap.exists()) {
          const metaData = metaSnap.data()
          remoteVersion = metaData.version || metaData.updatedAt || null
        }
      } catch (e) {
        console.warn('[ProductService] Gagal cek meta version, fallback ke sync full', e)
      }

      // Kalo ada versi remote dan versi lokal sama, langsung pake lokal - 0 reads tambahan
      if (remoteVersion) {
        try {
          const localVersion = localStorage.getItem(VERSION_KEY)
          if (localVersion && localVersion === String(remoteVersion)) {
            const localData = await productRepo.getPublished()
            if (localData.length > 0) {
              console.log('[ProductService] EXTREME CACHE HIT - versi sama, 0 reads! Hemat 351 reads')
              return localData
            }
          }
        } catch {}
      }

      // Kalo versi beda atau belum ada cache, baru sync full 351 reads
      console.log('[ProductService] Versi beda / belum ada cache, sync full...')

      // 1. Sync products
      const q = query(collection(firestoreDb, 'products'), where('isPublished', '==', true))
      const snapshot = await getDocs(q)
      const remoteProducts = []
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.deleted) return
        remoteProducts.push({
          id: doc.id,
          name: data.name || '',
          category: data.category || 'UMUM',
          unit: data.unit || 'PCS',
          price_sell: Number(data.price_sell) || 0,
          price_modal: Number(data.price_modal) || 0,
          packPrice: Number(data.packPrice) || 0,
          packQty: Number(data.packQty) || 0,
          purchasePackName: data.purchasePackName || '',
          qty: Number(data.qty) || 0,
          minStock: Number(data.minStock) || 2,
          isPublished: data.isPublished ? 1 : 0,
          imageUrl: data.imageUrl || null,
          imagePublicId: data.imagePublicId || null,
          updatedAt: data.updatedAt || new Date().toISOString(),
          deleted: 0,
          synced: 1
        })
      })
      if (remoteProducts.length > 0) await productRepo.bulkSave(remoteProducts)

      // 2. Sync product_packages
      try {
        const pkgSnap = await getDocs(collection(firestoreDb, 'product_packages'))
        const remotePkgs = pkgSnap.docs
          .map(d => {
            const data = d.data()
            return { ...data, id: d.id, synced: 1, deleted: data.deleted ? 1 : 0 }
          })
          .filter(p => !p.deleted)
        if (remotePkgs.length) await db.product_packages.bulkPut(remotePkgs)
      } catch (e) {
        console.warn('[ProductService] Gagal sync product_packages', e)
      }

      // 3. Sync services - ANTI BOCOR
      try {
        const svcSnap = await getDocs(collection(firestoreDb, 'services'))
        const remoteSvcs = svcSnap.docs
          .map(d => {
            const data = d.data()
            if (data.deleted) return null
            const ids = getServiceIds(data)
            return {
              ...data,
              id: d.id,
              name: data.name || '',
              price: Number(data.price) || 0,
              productId: data.productId || null,
              productIds: ids,
              category: (data.category || 'UMUM').toUpperCase(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              synced: 1,
              deleted: 0
            }
          })
          .filter(Boolean)
        if (remoteSvcs.length) await db.services.bulkPut(remoteSvcs)
        console.log(`[ProductService] Synced ${remoteSvcs.length} services`)
      } catch (e) {
        console.warn('[ProductService] Gagal sync services', e)
      }

      // simpan versi baru + timestamp
      try {
        if (remoteVersion) {
          localStorage.setItem(VERSION_KEY, String(remoteVersion))
        } else {
          // kalo meta belum ada, bikin versi dari jam sekarang biar next ga sync full lagi
          localStorage.setItem(VERSION_KEY, String(Date.now()))
        }
        localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
      } catch {}

      return await productRepo.getPublished()
    } catch (error) {
      console.error('[ProductService] Error:', error)
      return await productRepo.getPublished()
    }
  }
}