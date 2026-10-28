import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartRepo } from '../db/repositories/cartRepository'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  async function loadCart() {
    items.value = await cartRepo.getAll()
  }

  async function addToCart(product, qty = 1) {
    const plainProduct = JSON.parse(JSON.stringify(product))
    
    const existing = items.value.find(i => 
      i.productId === plainProduct.id && 
      i.packageId === (plainProduct.packageId || null) &&
      JSON.stringify(i.services || []) === JSON.stringify(plainProduct.services || [])
    )
    
    if (existing) {
      existing.qty += qty
      existing.updatedAt = new Date().toISOString()
      await cartRepo.save(existing)
    } else {
      const newItem = {
        id: crypto.randomUUID(),
        productId: plainProduct.id,
        name: plainProduct.name,
        originalName: plainProduct.originalName || plainProduct.name,
        price_sell: Number(plainProduct.price_sell) || 0,
        imageUrl: plainProduct.imageUrl || null,
        qty: qty,
        unit: plainProduct.unit || 'PCS',
        note: plainProduct.note || '',
        packageId: plainProduct.packageId || null,
        services: plainProduct.services || [],
        category: plainProduct.category || 'UMUM',
        updatedAt: new Date().toISOString()
      }
      await cartRepo.save(newItem)
    }
    await loadCart()
  }

  // FIX: pake cartId (id random), bukan productId
  async function updateQty(cartId, qty) {
    if (qty <= 0) {
      await cartRepo.removeById(cartId)
    } else {
      await cartRepo.updateQtyById(cartId, qty)
    }
    await loadCart()
  }

  async function removeFromCart(cartId) {
    await cartRepo.removeById(cartId)
    await loadCart()
  }

  async function clearCart() {
    await cartRepo.clear()
    items.value = []
  }

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))
  const totalPrice = computed(() => items.value.reduce((sum, i) => sum + (i.price_sell * i.qty), 0))

  return { items, loadCart, addToCart, updateQty, removeFromCart, clearCart, totalItems, totalPrice }
})