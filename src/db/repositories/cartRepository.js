import { db } from '../index.js'

export const cartRepo = {
  async getAll() {
    return await db.cart.toArray()
  },
  async getByProductId(productId) {
    return await db.cart.where('productId').equals(productId).first()
  },
  async save(item) {
    return await db.cart.put(item)
  },
  async updateQty(productId, qty) {
    const item = await this.getByProductId(productId)
    if (item) {
      if (qty <= 0) {
        await this.remove(productId)
      } else {
        item.qty = qty
        item.updatedAt = new Date().toISOString()
        await db.cart.put(item)
      }
    }
  },
  async remove(productId) {
    await db.cart.where('productId').equals(productId).delete()
  },
  async clear() {
    await db.cart.clear()
  }
}
