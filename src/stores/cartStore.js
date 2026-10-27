import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartRepo } from '../db/repositories/cartRepository'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  async function loadCart() {
    items.value = await cartRepo.getAll()
  }

  async function addToCart(product, qty = 1) {
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.qty += qty
      await cartRepo.save(existing)
    } else {
      const newItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price_sell: product.price_sell,
        imageUrl: product.imageUrl,
        qty: qty,
        unit: product.unit || 'PCS',
        note: product.note || '',
        updatedAt: new Date().toISOString()
      }
      await cartRepo.save(newItem)
    }
    await loadCart()
  }

  async function updateQty(productId, qty) {
    await cartRepo.updateQty(productId, qty)
    await loadCart()
  }

  async function removeFromCart(productId) {
    await cartRepo.remove(productId)
    await loadCart()
  }

  async function clearCart() {
    await cartRepo.clear()
    items.value = []
  }

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))
  const totalPrice = computed(() => items.value.reduce((sum, i) => sum + (i.price_sell * i.qty), 0))

  return {
    items,
    loadCart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice
  }
})
