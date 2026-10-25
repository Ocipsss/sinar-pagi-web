import { collection, getDocs, query, where } from 'firebase/firestore'
import { db as firestoreDb } from './firebase.js'
import { productRepo } from '../db/repositories/productRepository.js'

export const productService = {
  async syncPublishedProducts() {
    try {
      if (!navigator.onLine) {
        console.log('[ProductService] Offline, pake IndexedDB')
        return await productRepo.getPublished()
      }
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
          price_sell: Number(data.price_sell) || 0,
          qty: Number(data.qty) || 0,
          isPublished: data.isPublished ? 1 : 0,
          imageUrl: data.imageUrl || null,
          imagePublicId: data.imagePublicId || null,
          updatedAt: data.updatedAt || new Date().toISOString(),
          deleted: 0
        })
      })
      if (remoteProducts.length > 0) await productRepo.bulkSave(remoteProducts)
      return await productRepo.getPublished()
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        console.warn('[ProductService] AbortError ignored (Vite HMR)')
        return await productRepo.getPublished()
      }
      console.error('[ProductService] Error:', error)
      return await productRepo.getPublished()
    }
  }
}