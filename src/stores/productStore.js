import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productService } from '../services/productService'
import { productRepo } from '../db/repositories/productRepository'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedCategory = ref('SEMUA')

  const categories = computed(() => {
    const cats = new Set(products.value.map(p => p.category || 'UMUM'))
    return ['SEMUA', ...Array.from(cats)]
  })

  const filteredProducts = computed(() => {
    return products.value.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchCategory = selectedCategory.value === 'SEMUA' || p.category === selectedCategory.value
      return matchSearch && matchCategory
    })
  })

  async function loadProducts() {
    loading.value = true
    try {
      const data = await productService.syncPublishedProducts()
      products.value = data || []
    } catch (err) {
      console.error('[ProductStore] Gagal memuat produk:', err)
      products.value = await productRepo.getPublished()
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    searchQuery,
    selectedCategory,
    categories,
    filteredProducts,
    loadProducts
  }
})
