import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productService } from '../services/productService'
import { productRepo } from '../db/repositories/productRepository'
import { PINNED_CATEGORIES, VISIBLE_COUNT } from '../config/catalogCategory.js'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedCategory = ref('SEMUA')

  // AMBIL PINNED DARI LOCALSTORAGE DULU, KALO GA ADA BARU DARI CONFIG FILE
  function getPinnedCategories() {
    try {
      const fromLS = JSON.parse(localStorage.getItem('sinar_pagi_pinned_categories') || 'null')
      if (fromLS && Array.isArray(fromLS) && fromLS.length > 0) return fromLS
    } catch {}
    return PINNED_CATEGORIES
  }

  const categories = computed(() => {
    const cats = new Set(products.value.map(p => p.category || 'UMUM'))
    return ['SEMUA', ...Array.from(cats)]
  })

  // MEMINDAHKAN LOGIKA POPULAR CATEGORIES DARI CATALOG.VUE KE STORE
  const popularCategories = computed(() => {
    const all = categories.value || []
    const catsOnly = all.filter(c => c !== 'SEMUA' && c.toUpperCase() !== 'SEMUA')
    const pinned = getPinnedCategories()

    // KALO PINNED ADA ISINYA, PAKE PINNED SESUAI URUTAN
    if (pinned && pinned.length > 0) {
      const valid = pinned.filter(p => catsOnly.includes(p))
      if (valid.length > 0) return valid.slice(0, VISIBLE_COUNT)
    }

    // KALO PINNED KOSONG, FALLBACK AUTO PALING LARIS (JUMLAH PRODUK TERBANYAK)
    const counts = {}
    if (products.value.length === 0) {
      return catsOnly.sort((a, b) => a.localeCompare(b)).slice(0, VISIBLE_COUNT)
    }
    products.value.forEach(p => {
      const cat = p.category || 'UMUM'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return catsOnly.sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, VISIBLE_COUNT)
  })

  const visibleCategories = computed(() => {
    return ['SEMUA', ...popularCategories.value]
  })

  const remainingCategories = computed(() => {
    const visibleSet = new Set(visibleCategories.value)
    return categories.value.filter(c => !visibleSet.has(c))
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

  // HELPER UNTUK OPSI PRODUK LEWAT REPOSITORY (VIEW TANPA TOUCH DB)
  async function fetchProductPackages(productId) {
    return await productRepo.getPackagesByProductId(productId)
  }

  async function fetchAllServices() {
    return await productRepo.getAllServices()
  }

  return {
    products,
    loading,
    searchQuery,
    selectedCategory,
    categories,
    popularCategories,
    visibleCategories,
    remainingCategories,
    filteredProducts,
    loadProducts,
    fetchProductPackages,
    fetchAllServices
  }
})
