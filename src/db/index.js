// src/db/index.js
import Dexie from 'dexie'

export const db = new Dexie('SinarPagiWebDB')

// Schema IndexedDB Khusus Web Pelanggan (sinar-pagi-web)
db.version(1).stores({
  products: 'id, name, category, isPublished, updatedAt, synced, deleted',
  cart: 'id, productId, updatedAt',
  settings: 'id, updatedAt'
})

export default db
