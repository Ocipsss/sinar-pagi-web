import { db } from '../index.js'

export const productRepo = {
  getPublished: async () => {
    const list = await db.products.where('isPublished').equals(1).toArray()
    return list.filter(p => !p.deleted)
  },
  getById: async (id) => {
    const item = await db.products.get(id)
    return item && item.isPublished && !item.deleted ? item : null
  },
  getByCategory: async (category) => {
    if (!category || category === 'SEMUA') return productRepo.getPublished()
    const list = await db.products.where('category').equals(category).toArray()
    return list.filter(p => p.isPublished && !p.deleted)
  },
  bulkSave: async (products) => {
    if (!products.length) return
    await db.transaction('rw', db.products, async () => {
      for (const p of products) {
        await db.products.put({ ...p, synced: 1 })
      }
    })
  },
  // MEWADAHI QUERY PACKAGES AGAR VIEW TIDAK TOUCH DB
  getPackagesByProductId: async (productId) => {
    const allPkgs = await db.product_packages.where('productId').equals(productId).toArray()
    return allPkgs.filter(p => !p.deleted)
  },
  // MEWADAHI QUERY SERVICES AGAR VIEW TIDAK TOUCH DB
  getAllServices: async () => {
    const allServices = await db.services.toArray()
    return allServices.filter(s => !s.deleted)
  }
}
