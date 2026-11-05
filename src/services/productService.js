// src/services/productService.js - SUPER EKSTRIM DELTA 1 BARANG = 1 ROW (VERSI SUPABASE)
// MAPPING 1:1 dari Firebase asli lo, cuma ganti firestoreDb -> supabase
// Logic: VERSION_KEY, LAST_PULL_KEY, CACHE HIT, DELTA, FULL SYNC tetep sama

import { productRepo } from '../db/repositories/productRepository.js'
import { db } from '../db/index.js'
import { supabase } from './supabase.js'

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

      // 1. CEK VERSI DULU - CUMA 1 ROW (dulu 1 READ)
      let remoteVersion = null
      try {
        // GANTI: dulu doc(firestoreDb, 'meta', 'catalog') -> sekarang ambil max updated_at dari products
        const { data, error } = await supabase.from('products').select('updated_at').order('updated_at', { ascending: false }).limit(1)
        if (!error && data && data.length) {
          remoteVersion = data[0].updated_at
        }
      } catch (e) {
        console.warn('[ProductService] Gagal cek meta version', e)
      }

      // 2. KALO VERSI SAMA - 0 ROWS TAMBAHAN
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

      // 3. DELTA SYNC - CUMA YANG BERUBAH DOANG (1 BARANG = 1 ROW)
      if (lastPull && remoteVersion) {
        console.log(`[ProductService] DELTA SYNC since ${lastPull}...`)
        let totalReads = 0

        // Produk yang berubah
        try {
          // GANTI: dulu query(collection(firestoreDb, 'products'), where('updatedAt', '>', lastPull))
          const { data: prodData, error } = await supabase.from('products').select('*').gt('updated_at', lastPull)
          if (error) throw error
          totalReads += prodData?.length || 0
          if (prodData && prodData.length) {
            const changed = []
            prodData.forEach(d => {
              // handle soft delete
              if (d.deleted) {
                changed.push({ id: d.id, deleted: 1, updated_at: d.updated_at, updatedAt: d.updated_at, synced: 1 })
              } else {
                changed.push({
                  id: d.id,
                  name: d.name || '',
                  category: d.category || 'UMUM',
                  unit: d.unit || 'PCS',
                  price_sell: Number(d.price_sell) || 0,
                  price_modal: Number(d.price_modal) || 0,
                  packPrice: Number(d.packPrice) || 0,
                  packQty: Number(d.packQty) || 0,
                  purchasePackName: d.purchasePackName || '',
                  qty: Number(d.qty) || 0,
                  minStock: Number(d.minStock) || 2,
                  isPublished: d.isPublished || d.is_published ? 1 : 0,
                  imageUrl: d.imageUrl || d.image_url || null,
                  imagePublicId: d.imagePublicId || d.image_public_id || null,
                  updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
                  updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
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
          const { data: pkgData, error } = await supabase.from('product_packages').select('*').gt('updated_at', lastPull)
          if (error) throw error
          totalReads += pkgData?.length || 0
          if (pkgData && pkgData.length) {
            const changedPkg = pkgData.map(d => ({ ...d, id: d.id, synced: 1, deleted: d.deleted ? 1 : 0, updated_at: d.updated_at, updatedAt: d.updated_at }))
            // hapus yang deleted
            const toPut = changedPkg.filter(p => !p.deleted)
            const toDelete = changedPkg.filter(p => p.deleted)
            if (toPut.length) await db.product_packages.bulkPut(toPut)
            if (toDelete.length) {
              for (const del of toDelete) {
                await db.product_packages.update(del.id, { deleted: true })
              }
            }
            console.log(`[ProductService] Delta packages: ${pkgData.length} reads`)
          }
        } catch (e) {
          console.warn('[ProductService] Delta packages gagal', e)
        }

        // Jasa yang berubah
        try {
          const { data: svcData, error } = await supabase.from('services').select('*').gt('updated_at', lastPull)
          if (error) throw error
          totalReads += svcData?.length || 0
          if (svcData && svcData.length) {
            const changedSvc = []
            svcData.forEach(d => {
              if (d.deleted) {
                changedSvc.push({ id: d.id, deleted: 1, updated_at: d.updated_at, updatedAt: d.updated_at, synced: 1 })
              } else {
                const ids = getServiceIds(d)
                changedSvc.push({
                  ...d,
                  id: d.id,
                  name: d.name || '',
                  price: Number(d.price) || 0,
                  productId: d.productId || d.product_id || null,
                  productIds: ids,
                  category: (d.category || 'UMUM').toUpperCase(),
                  updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
                  updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
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

      // GANTI: dulu query(collection(firestoreDb, 'products'), where('isPublished', '==', true))
      const { data: snapshot, error } = await supabase.from('products').select('*').or('isPublished.eq.true,is_published.eq.true')
      const remoteProducts = []
      if (!error && snapshot) {
        snapshot.forEach(d => {
          if (d.deleted) return
          remoteProducts.push({
            id: d.id,
            name: d.name || '',
            category: d.category || 'UMUM',
            unit: d.unit || 'PCS',
            price_sell: Number(d.price_sell) || 0,
            price_modal: Number(d.price_modal) || 0,
            packPrice: Number(d.packPrice) || 0,
            packQty: Number(d.packQty) || 0,
            purchasePackName: d.purchasePackName || '',
            qty: Number(d.qty) || 0,
            minStock: Number(d.minStock) || 2,
            isPublished: d.isPublished || d.is_published ? 1 : 0,
            imageUrl: d.imageUrl || d.image_url || null,
            imagePublicId: d.imagePublicId || d.image_public_id || null,
            updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
            updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
            deleted: 0,
            synced: 1
          })
        })
      }
      if (remoteProducts.length > 0) await productRepo.bulkSave(remoteProducts)

      try {
        const { data: pkgSnap } = await supabase.from('product_packages').select('*')
        const remotePkgs = (pkgSnap || [])
          .map(d => ({ ...d, id: d.id, synced: 1, deleted: d.deleted ? 1 : 0, updated_at: d.updated_at, updatedAt: d.updated_at }))
          .filter(p => !p.deleted)
        if (remotePkgs.length) await db.product_packages.bulkPut(remotePkgs)
      } catch (e) {
        console.warn('[ProductService] Gagal sync packages', e)
      }

      try {
        const { data: svcSnap } = await supabase.from('services').select('*')
        const remoteSvcs = (svcSnap || [])
          .map(d => {
            if (d.deleted) return null
            const ids = getServiceIds(d)
            return {
              ...d,
              id: d.id,
              name: d.name || '',
              price: Number(d.price) || 0,
              productId: d.productId || d.product_id || null,
              productIds: ids,
              category: (d.category || 'UMUM').toUpperCase(),
              updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
              updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
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