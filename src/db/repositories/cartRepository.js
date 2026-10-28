import { db } from '../index.js'

function toPlain(obj) {
  // Paling aman buat IDB: JSON clone biar hilang semua Proxy & function
  return JSON.parse(JSON.stringify(obj))
}

export const cartRepo = {
  async getAll() {
    return await db.cart.toArray()
  },

  async save(item) {
    const plain = toPlain(item)
    return await db.cart.put(plain)
  },

  async removeById(cartId) {
    await db.cart.delete(cartId)
  },

  async updateQtyById(cartId, qty) {
    const item = await db.cart.get(cartId)
    if (item) {
      item.qty = qty
      item.updatedAt = new Date().toISOString()
      await db.cart.put(toPlain(item))
    }
  },

  async clear() {
    await db.cart.clear()
  }
}