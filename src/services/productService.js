// src/services/productService.js - SUPER EKSTRIM DELTA 1 BARANG = 1 READ
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
const LAST_PULL_KEY = 'sinar_pagi_last_pull'

export const productService = {
  async syncPublishedProducts() {
    try {
      if (!navigator.onLine) {
        return await productRepo.getPublished()
      }

      // 1. CEK VERSI DULU - CUMA 1 READ
      let remoteVersion = null
      try {
        const metaRef = doc(firestoreDb, 'meta', 'catalog')
        const metaSnap = await getDoc(metaRef)
        if (metaSnap.exists()) {
          const metaData = metaSnap.data()
          remoteVersion = metaData.version || metaData.updatedAt || null
        }
      } catch (e) {
        console.warn('[ProductService] Gagal cek meta version', e)
      }

      // 2. KALO VERSI SAMA - 0 READS TAMBAHAN
      if (remoteVersion) {
        try {
          const localVersion = localStorage.getItem(VERSION_KEY)
          if (localVersion && localVersion === String(remoteVersion)) {
            const localData = await productRepo.getPublished()
            if (localData.length > 0) {
              console.log('[ProductService] CACHE HIT - 0 reads tambahan! Hemat')
              return localData
            }
          }
        } catch {}
      }

      const lastPull = localStorage.getItem(LAST_PULL_KEY)

      // 3. DELTA SYNC - CUMA YANG BERUBAH DOANG (1 BARANG = 1 READ)
      if (lastPull && remoteVersion) {
        console.log(`[ProductService] DELTA SYNC since ${lastPull}...`)
        let totalReads = 0

        // Produk yang berubah
        try {
          const qProd = query(collection(firestoreDb, 'products'), where('updatedAt', '>', lastPull))
          const snapProd = await getDocs(qProd)
          totalReads += snapProd.size
          if (!snapProd.empty) {
            const changed = []
            snapProd.forEach(d => {
              const data = d.data()
              // handle soft delete
              if (data.deleted) {
                changed.push({ id: d.id, deleted: 1, updatedAt: data.updatedAt, synced: 1 })
              } else {
                changed.push({
                  id: d.id,
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
              }
            })
            if (changed.length) await db.products.bulkPut(changed)
            console.log(`[ProductService] Delta products: ${changed.length} reads (bukan 250)`)
          }
        } catch (e) {
          console.warn('[ProductService] Delta products gagal', e)
        }

        // Paket yang berubah
        try {
          const qPkg = query(collection(firestoreDb, 'product_packages'), where('updatedAt', '>', lastPull))
          const snapPkg = await getDocs(qPkg)
          totalReads += snapPkg.size
          if (!snapPkg.empty) {
            const changedPkg = snapPkg.docs.map(d => ({ ...d.data(), id: d.id, synced: 1, deleted: d.data().deleted ? 1 : 0 }))
            // hapus yang deleted
            const toPut = changedPkg.filter(p => !p.deleted)
            const toDelete = changedPkg.filter(p => p.deleted)
            if (toPut.length) await db.product_packages.bulkPut(toPut)
            if (toDelete.length) {
              for (const del of toDelete) {
                await db.product_packages.update(del.id, { deleted: true })
              }
            }
            console.log(`[ProductService] Delta packages: ${snapPkg.size} reads`)
          }
        } catch (e) {
          console.warn('[ProductService] Delta packages gagal', e)
        }

        // Jasa yang berubah
        try {
          const qSvc = query(collection(firestoreDb, 'services'), where('updatedAt', '>', lastPull))
          const snapSvc = await getDocs(qSvc)
          totalReads += snapSvc.size
          if (!snapSvc.empty) {
            const changedSvc = []
            snapSvc.forEach(d => {
              const data = d.data()
              if (data.deleted) {
                changedSvc.push({ id: d.id, deleted: 1, updatedAt: data.updatedAt, synced: 1 })
              } else {
                const ids = getServiceIds(data)
                changedSvc.push({
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
                })
              }
            })
            if (changedSvc.length) await db.services.bulkPut(changedSvc)
            console.log(`[ProductService] Delta services: ${changedSvc.length} reads`)
          }
        } catch (e) {
          console.warn('[ProductService] Delta services gagal', e)
        }

        console.log(`[ProductService] TOTAL DELTA READS: ${totalReads} (hemat ${351 - totalReads} reads)`)

        // simpan versi + lastPull
        try {
          if (remoteVersion) localStorage.setItem(VERSION_KEY, String(remoteVersion))
          localStorage.setItem(LAST_PULL_KEY, new Date().toISOString())
        } catch {}

        return await productRepo.getPublished()
      }

      // 4. FULL SYNC - CUMA PERTAMA KALI AJA (351 reads sekali seumur hidup)
      console.log('[ProductService] First time, sync full 351 reads...')

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

      try {
        const pkgSnap = await getDocs(collection(firestoreDb, 'product_packages'))
        const remotePkgs = pkgSnap.docs
          .map(d => ({ ...d.data(), id: d.id, synced: 1, deleted: d.data().deleted ? 1 : 0 }))
          .filter(p => !p.deleted)
        if (remotePkgs.length) await db.product_packages.bulkPut(remotePkgs)
      } catch (e) {
        console.warn('[ProductService] Gagal sync packages', e)
      }

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
      } catch (e) {
        console.warn('[ProductService] Gagal sync services', e)
      }

      try {
        if (remoteVersion) {
          localStorage.setItem(VERSION_KEY, String(remoteVersion))
        } else {
          localStorage.setItem(VERSION_KEY, String(Date.now()))
        }
        localStorage.setItem(LAST_PULL_KEY, new Date().toISOString())
      } catch {}

      return await productRepo.getPublished()
    } catch (error) {
      console.error('[ProductService] Error:', error)
      return await productRepo.getPublished()
    }
  }
}