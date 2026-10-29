import { ref } from 'vue'

export function useCartAnimation() {
  const isCartBouncing = ref(false)
  const addedProductId = ref(null)

  /**
   * Menjalankan animasi micro-feedback di tombol + bounce pada keranjang
   * @param {String|Number} productId - ID produk yang baru ditambahkan
   * @param {Number} duration - Durasi animasi dalam ms
   */
  function triggerCartAnimation(productId = null, duration = 600) {
    // 1. Set ID produk untuk menampilkan badge / micro-toast "✓ Ditambahkan"
    if (productId) {
      addedProductId.value = productId
    }

    // 2. Trigger efek bounce pada keranjang
    isCartBouncing.value = true

    // 3. Reset state setelah durasi selesai
    setTimeout(() => {
      isCartBouncing.value = false
      addedProductId.value = null
    }, duration)
  }

  return {
    isCartBouncing,
    addedProductId,
    triggerCartAnimation
  }
}
