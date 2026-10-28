// src/db/index.js - FINAL CLEAN WEB sinkron sama kasir v1 reset
import Dexie from 'dexie'

export const db = new Dexie('SinarPagiWebDB')

db.version(1).stores({
  products: 'id, name, category, isPublished, updatedAt, synced, deleted',
  product_packages: 'id, productId, name, order, qty_pcs, price_sell, updatedAt, synced, deleted',
  services: 'id, name, price, category, *productIds, productId, updatedAt, synced, deleted',
  cart: 'id, productId, updatedAt',
  settings: 'id, updatedAt'
})

export default db