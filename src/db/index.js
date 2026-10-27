// src/db/index.js
import Dexie from 'dexie'

export const db = new Dexie('SinarPagiWebDB')

// v2 - Tambah product_packages & services biar sinkron sama kasir Pengaturan Menu & Jasa
db.version(2).stores({
  products: 'id, name, category, isPublished, updatedAt, synced, deleted',
  product_packages: 'id, productId, name',
  services: 'id, name, category',
  cart: 'id, productId, updatedAt',
  settings: 'id, updatedAt'
})

db.version(1).stores({
  products: 'id, name, category, isPublished, updatedAt, synced, deleted',
  cart: 'id, productId, updatedAt',
  settings: 'id, updatedAt'
})

export default db
