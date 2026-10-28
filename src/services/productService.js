import { collection, getDocs, query, where } from 'firebase/firestore'
import { db as firestoreDb } from './firebase.js'
import { productRepo } from '../db/repositories/productRepository.js'
import { db } from '../db/index.js'

const getServiceIds = (s) => {
  if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
  if (s.productId) return [s.productId]
  return []
}

export const productService = {
  async syncPublishedProducts() {
    try {
      if (!navigator.onLine) {
        return await productRepo.getPublished()
      }

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

      // 2. Sync product_packages - bawa order biar drag & drop kasir kebawa
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

      // 3. Sync services - FIX MULTI PRODUK + ANTI BOCOR
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

      return await productRepo.getPublished()
    } catch (error) {
      console.error('[ProductService] Error:', error)
      return await productRepo.getPublished()
    }
  }
}