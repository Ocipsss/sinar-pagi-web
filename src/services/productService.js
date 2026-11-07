// src/services/productService.js
import { productRepo } from '../db/repositories/productRepository.js'
import { db } from '../db/index.js'
import { supabase } from './supabase.js'

const getServiceIds = (s) => {
  if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
  if (s.productId) return [s.productId]
  if (s.product_id) return [s.product_id]
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

      // 1. CEK VERSI (Melihat updated_at paling baru dari Supabase)
      let remoteVersion = null
      try {
        const { data, error } = await supabase
          .from('products')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)

        if (!error && data && data.length) {
          remoteVersion = data[0].updated_at
        }
      } catch (e) {
        console.warn('[ProductService] Gagal cek meta version', e)
      }

      // 2. KALO VERSI SAMA -> CACHE HIT (0 Rows Read)
      if (remoteVersion) {
        try {
          const localVersion = localStorage.getItem(VERSION_KEY)
          if (localVersion && localVersion === String(remoteVersion)) {
            const localData = await productRepo.getPublished()
            if (localData.length > 0) {
              console.log('[ProductService] CACHE HIT - Memuat data dari Dexie lokal!')
              return localData
            }
          }
        } catch {}
      }

      const lastPull = localStorage.getItem(LAST_PULL_KEY)

      // 3. DELTA SYNC (Cuma ambil data yang berubah sejak lastPull)
      if (lastPull && remoteVersion) {
        console.log(`[ProductService] DELTA SYNC since ${lastPull}...`)
        let totalReads = 0

        // Sync Delta Products (DENGAN RELASI CATEGORIES)
        try {
          const { data: prodData, error } = await supabase
            .from('products')
            .select('*, categories(id, name)')
            .gt('updated_at', lastPull)

          if (error) throw error
          totalReads += prodData?.length || 0

          if (prodData && prodData.length) {
            const changed = prodData.map(d => ({
              id: d.id,
              name: d.name || '',
              category_id: d.category_id || d.categoryId || null,
              category: d.category || d.categories?.name || 'UMUM',
              unit: d.unit || 'PCS',
              price_sell: Number(d.price_sell || d.price || 0),
              price_modal: Number(d.price_modal || 0),
              packPrice: Number(d.pack_price || d.packPrice || 0),
              packQty: Number(d.pack_qty || d.packQty || 0),
              purchasePackName: d.purchase_pack_name || d.purchasePackName || '',
              qty: Number(d.qty || d.stock || 0),
              minStock: Number(d.min_stock || d.minStock || 2),
              isPublished: (d.is_published ?? d.isPublished ?? true) ? 1 : 0,
              imageUrl: d.image_url || d.imageUrl || null,
              imagePublicId: d.image_public_id || d.imagePublicId || null,
              updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
              updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
              deleted: d.deleted ? 1 : 0,
              synced: 1
            }))
            await db.products.bulkPut(changed)
          }
        } catch (e) {
          console.warn('[ProductService] Delta products gagal', e)
        }

        // Sync Delta Packages
        try {
          const { data: pkgData, error } = await supabase
            .from('product_packages')
            .select('*')
            .gt('updated_at', lastPull)

          if (error) throw error
          totalReads += pkgData?.length || 0

          if (pkgData && pkgData.length) {
            const changedPkg = pkgData.map(d => ({
              id: d.id,
              productId: d.product_id || d.productId,
              name: d.name,
              qty_pcs: d.qty_pcs || d.multiplier || 1,
              price_sell: Number(d.price_sell) || 0,
              order: d.order || 0,
              updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
              updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
              deleted: d.deleted ? 1 : 0,
              synced: 1
            }))
            const toPut = changedPkg.filter(p => !p.deleted)
            if (toPut.length) await db.product_packages.bulkPut(toPut)
          }
        } catch (e) {
          console.warn('[ProductService] Delta packages gagal', e)
        }

        // Simpan versi + timestamp
        try {
          if (remoteVersion) localStorage.setItem(VERSION_KEY, String(remoteVersion))
          localStorage.setItem(LAST_PULL_KEY, new Date().toISOString())
        } catch {}

        return await productRepo.getPublished()
      }

      // 4. FULL SYNC PERTAMA KALI (DENGAN RELASI CATEGORIES)
      console.log('[ProductService] Full Sync Produk dari Supabase...')

      const { data: snapshot, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('is_published', true)

      if (!error && snapshot) {
        const remoteProducts = snapshot
          .filter(d => !d.deleted)
          .map(d => ({
            id: d.id,
            name: d.name || '',
            category_id: d.category_id || d.categoryId || null,
            category: d.category || d.categories?.name || 'UMUM',
            unit: d.unit || 'PCS',
            price_sell: Number(d.price_sell || d.price || 0),
            price_modal: Number(d.price_modal || 0),
            packPrice: Number(d.pack_price || d.packPrice || 0),
            packQty: Number(d.pack_qty || d.packQty || 0),
            purchasePackName: d.purchase_pack_name || d.purchasePackName || '',
            qty: Number(d.qty || d.stock || 0),
            minStock: Number(d.min_stock || d.minStock || 2),
            isPublished: (d.is_published ?? d.isPublished ?? true) ? 1 : 0,
            imageUrl: d.image_url || d.imageUrl || null,
            imagePublicId: d.image_public_id || d.imagePublicId || null,
            updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
            updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
            deleted: 0,
            synced: 1
          }))

        if (remoteProducts.length > 0) await productRepo.bulkSave(remoteProducts)
      }

      // Full Sync Packages & Services
      try {
        const { data: pkgSnap } = await supabase.from('product_packages').select('*')
        if (pkgSnap?.length) {
          const remotePkgs = pkgSnap
            .filter(p => !p.deleted)
            .map(d => ({
              id: d.id,
              productId: d.product_id || d.productId,
              name: d.name,
              qty_pcs: d.qty_pcs || d.multiplier || 1,
              price_sell: Number(d.price_sell) || 0,
              order: d.order || 0,
              updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
              updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
              deleted: 0,
              synced: 1
            }))
          await db.product_packages.bulkPut(remotePkgs)
        }
      } catch (e) {
        console.warn('[ProductService] Full sync packages gagal', e)
      }

      try {
        const { data: svcSnap } = await supabase.from('services').select('*')
        if (svcSnap?.length) {
          const remoteSvcs = svcSnap
            .filter(d => !d.deleted)
            .map(d => ({
              id: d.id,
              name: d.name || '',
              price: Number(d.price) || 0,
              productId: d.productId || d.product_id || null,
              productIds: getServiceIds(d),
              category: (d.category || 'UMUM').toUpperCase(),
              updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
              updated_at: d.updated_at || d.updatedAt || new Date().toISOString(),
              deleted: 0,
              synced: 1
            }))
          await db.services.bulkPut(remoteSvcs)
        }
      } catch (e) {
        console.warn('[ProductService] Full sync services gagal', e)
      }

      // Simpan LocalStorage Cache Meta
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
