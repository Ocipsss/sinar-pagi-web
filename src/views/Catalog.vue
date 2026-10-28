<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { getThumbUrl } from '../services/cloudinaryService'
import { formatRupiah } from '../utils/formatters'
import { buildCartItem } from '../utils/productHelper'
import { db } from '../db/index.js'
import { PINNED_CATEGORIES, VISIBLE_COUNT } from '../config/catalogCategory.js'
import { Search, Package, Plus, AlertTriangle, ShoppingCart, ArrowRight, X } from 'lucide-vue-next'

const productStore = useProductStore()
const cartStore = useCartStore()

const showModal = ref(false)
const activeProduct = ref(null)
const selectedPackage = ref(null)
const selectedServices = ref([])
const productPackages = ref([])
const availableServices = ref([])

const showCategorySheet = ref(false)
const categorySearch = ref('')

onMounted(async () => {
  await productStore.loadProducts()
  await cartStore.loadCart()
})

// AMBIL PINNED DARI LOCALSTORAGE DULU, KALO GA ADA BARU DARI CONFIG FILE
function getPinnedCategories() {
  try {
    const fromLS = JSON.parse(localStorage.getItem('sinar_pagi_pinned_categories') || 'null')
    if (fromLS && Array.isArray(fromLS) && fromLS.length > 0) return fromLS
  } catch {}
  return PINNED_CATEGORIES
}

const popularCategories = computed(() => {
  const all = productStore.categories || []
  const catsOnly = all.filter(c => c !== 'SEMUA' && c.toUpperCase() !== 'SEMUA')
  const pinned = getPinnedCategories()

  // KALO PINNED ADA ISINYA, PAKE PINNED SESUAI URUTAN LU
  if (pinned && pinned.length > 0) {
    // filter biar cuma yang beneran ada di DB
    const valid = pinned.filter(p => catsOnly.includes(p))
    if (valid.length > 0) return valid.slice(0, VISIBLE_COUNT)
  }

  // KALO PINNED KOSONG, FALLBACK AUTO PALING LARIS (JUMLAH PRODUK TERBANYAK)
  const counts = {}
  const products = productStore.products || []
  if (products.length === 0) {
    return catsOnly.sort((a,b) => a.localeCompare(b)).slice(0, VISIBLE_COUNT)
  }
  products.forEach(p => {
    const cat = p.category || 'UMUM'
    counts[cat] = (counts[cat] || 0) + 1
  })
  return catsOnly.sort((a,b) => (counts[b]||0) - (counts[a]||0)).slice(0, VISIBLE_COUNT)
})

const visibleCategories = computed(() => {
  const semua = 'SEMUA'
  return [semua, ...popularCategories.value]
})

const remainingCategories = computed(() => {
  const all = productStore.categories || []
  const visibleSet = new Set(visibleCategories.value)
  return all.filter(c => !visibleSet.has(c))
})

const filteredSheetCategories = computed(() => {
  const all = productStore.categories || []
  const list = all.filter(c => c.toUpperCase() !== 'SEMUA')
  if (!categorySearch.value) return list.sort((a,b) => a.localeCompare(b))
  return list.filter(c => c.toLowerCase().includes(categorySearch.value.toLowerCase())).sort((a,b) => a.localeCompare(b))
})

function selectCategory(cat) {
  productStore.selectedCategory = cat
  showCategorySheet.value = false
}

async function openProductOptions(product) {
  let pkgs = []
  let services = []
  try {
    const allPkgs = await db.product_packages.where('productId').equals(product.id).toArray()
    pkgs = allPkgs.filter(p => !p.deleted).filter(p => {
      const name = (p.name || '').toUpperCase()
      const isBelanjaBesar = ['RENCENG','RENCENGAN','DUS','KARDUS'].some(bad => name.includes(bad))
      const isSatuBatang = (p.qty_pcs || 0) === 1
      return !isBelanjaBesar && !isSatuBatang
    }).sort((a,b) => (a.order ?? 999) - (b.order ?? 999))
  } catch { pkgs = [] }
  try {
    const allServices = (await db.services.toArray()).filter(s => !s.deleted)
    const getIds = (s) => {
      if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
      if (s.productId) return [s.productId]
      return []
    }
    const custom = allServices.filter(s => getIds(s).includes(product.id))
    if (custom.length > 0) services = custom
    else {
      const cat = (product.category || '').toUpperCase()
      services = allServices.filter(s => { const ids = getIds(s); return ids.length === 0 && (s.category || '').toUpperCase() === cat })
    }
  } catch { services = [] }
  const hasOptions = pkgs.length > 0 || services.length > 0
  if (!hasOptions) {
    const itemToAdd = buildCartItem(product, [], product.price_sell, null)
    cartStore.addToCart(itemToAdd, 1)
    return
  }
  activeProduct.value = product
  selectedPackage.value = null
  selectedServices.value = []
  productPackages.value = pkgs
  availableServices.value = services
  showModal.value = true
}

const totalPrice = computed(() => {
  if (!activeProduct.value) return 0
  let price = activeProduct.value.price_sell
  if (selectedPackage.value) price = selectedPackage.value.price_sell
  for (const svc of selectedServices.value) price += Number(svc.price) || 0
  return price
})

function toggleService(svc) {
  const exists = selectedServices.value.find(s => s.id === svc.id)
  if (exists) selectedServices.value = []
  else selectedServices.value = [svc]
}

function addToCartWithOptions() {
  if (!activeProduct.value) return
  const itemToAdd = buildCartItem(activeProduct.value, selectedServices.value, totalPrice.value, selectedPackage.value)
  cartStore.addToCart(itemToAdd, 1)
  showModal.value = false
  activeProduct.value = null
}

// BUAT DEBUG GONTA-GANTI CEPAT DI CONSOLE
window.setPinnedCategories = (arr) => {
  localStorage.setItem('sinar_pagi_pinned_categories', JSON.stringify(arr))
  location.reload()
}
window.clearPinnedCategories = () => {
  localStorage.removeItem('sinar_pagi_pinned_categories')
  location.reload()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-28">
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
      <div class="max-w-4xl mx-auto flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">Warung Sinar Pagi</h1>
          <router-link to="/cart" class="relative p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
            <ShoppingCart :size="20" />
            <span v-if="cartStore.totalItems > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-xs">{{ cartStore.totalItems }}</span>
          </router-link>
        </div>
        <div class="relative w-full">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><Search :size="18" /></span>
          <input v-model="productStore.searchQuery" type="text" placeholder="Cari barang di warung..." class="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 outline-none transition" />
          <button v-if="productStore.searchQuery" @click="productStore.searchQuery = ''" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 active:scale-90 transition"><X :size="18" /></button>
        </div>
        <!-- CHIP CUMA 4 + LAINNYA - URUTAN BISA DIATUR -->
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
          <button v-for="cat in visibleCategories" :key="cat" @click="productStore.selectedCategory = cat" :class="['px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0', productStore.selectedCategory === cat ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">{{ cat }}</button>
          <button v-if="remainingCategories.length > 0" @click="showCategorySheet=true" :class="['px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 border border-dashed', productStore.categories.some(c => remainingCategories.includes(c) && c === productStore.selectedCategory) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300']">Lainnya ({{ remainingCategories.length }})</button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto p-4">
      <div v-if="productStore.loading" class="flex justify-center items-center py-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      <div v-else-if="productStore.filteredProducts.length === 0" class="text-center py-20"><Package :size="48" class="mx-auto text-gray-300 mb-2" /><p class="text-gray-500 font-medium">Produk tidak ditemukan</p></div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="product in productStore.filteredProducts" :key="product.id" @click="openProductOptions(product)" class="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition cursor-pointer group">
          <div>
            <div class="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
              <img v-if="product.imageUrl" :src="getThumbUrl(product.imageUrl, 300)" :alt="product.name" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400"><Package :size="32" /></div>
              <span class="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium">{{ product.category || 'UMUM' }}</span>
            </div>
            <h2 class="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{{ product.name }}</h2>
            <p class="text-blue-600 font-bold text-sm">{{ formatRupiah(product.price_sell) }}</p>
          </div>
          <div class="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span class="text-[11px] text-gray-400 flex items-center gap-1"><AlertTriangle v-if="product.qty <= 2" :size="12" class="text-amber-500" />Stok: {{ product.qty }}</span>
            <span class="p-2 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition"><Plus :size="16" /></span>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal && activeProduct" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-black text-base text-zinc-900">Pilih Opsi</h3>
          <button @click="showModal = false" class="p-2 bg-zinc-100 rounded-xl text-zinc-500 hover:bg-zinc-200"><X :size="18"/></button>
        </div>
        <div class="flex gap-3 mb-5 items-center bg-zinc-50 p-3 rounded-2xl border">
          <div class="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0"><img v-if="activeProduct.imageUrl" :src="getThumbUrl(activeProduct.imageUrl, 200)" class="w-full h-full object-cover" /><div v-else class="w-full h-full flex items-center justify-center text-zinc-300"><Package :size="24"/></div></div>
          <div><h4 class="font-bold text-sm text-zinc-900 line-clamp-2">{{ activeProduct.name }}</h4><p class="text-xs text-zinc-500 mt-0.5">Stok: {{ activeProduct.qty }} {{ activeProduct.unit || 'PCS' }} • {{ activeProduct.category }}</p></div>
        </div>
        <div v-if="productPackages.length > 0" class="space-y-2 mb-4">
          <label class="text-[10px] font-bold uppercase text-zinc-400">Pilih Paket (urut sesuai kasir)</label>
          <button @click="selectedPackage = null" :class="['w-full p-3.5 rounded-2xl border flex items-center justify-between transition', !selectedPackage ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-zinc-200 bg-white text-zinc-800']">
            <div class="text-left"><p class="text-xs font-bold uppercase">Eceran / Per {{ activeProduct.unit || 'PCS' }}</p><p class="text-sm font-black text-blue-600">{{ formatRupiah(activeProduct.price_sell) }}</p></div>
            <div :class="['w-5 h-5 rounded-full border flex items-center justify-center', !selectedPackage ? 'border-blue-600 bg-blue-600 text-white' : 'border-zinc-300']"><div v-if="!selectedPackage" class="w-2 h-2 bg-white rounded-full"></div></div>
          </button>
          <button v-for="pkg in productPackages" :key="pkg.id" @click="selectedPackage = pkg" :class="['w-full p-3.5 rounded-2xl border flex items-center justify-between transition', selectedPackage?.id === pkg.id ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900' : 'border-zinc-200 bg-white text-zinc-800']">
            <div class="text-left"><p class="text-xs font-bold uppercase">{{ pkg.name }} ({{ pkg.qty_pcs }} {{ activeProduct.unit || 'PCS' }})</p><p class="text-sm font-black text-emerald-600">{{ formatRupiah(pkg.price_sell) }}</p></div>
            <div :class="['w-5 h-5 rounded-full border flex items-center justify-center', selectedPackage?.id === pkg.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-300']"><div v-if="selectedPackage?.id === pkg.id" class="w-2 h-2 bg-white rounded-full"></div></div>
          </button>
        </div>
        <div v-if="availableServices.length > 0" class="mb-6 space-y-2">
          <label class="text-[10px] font-bold uppercase text-zinc-400">Opsi Penyajian (Pilih 1) - {{ activeProduct.category }}</label>
          <button v-for="svc in availableServices" :key="svc.id" @click="toggleService(svc)" :class="['w-full p-3.5 rounded-2xl border flex items-center gap-3 transition text-left', selectedServices.find(s => s.id === svc.id) ? 'border-amber-500 bg-amber-50/50 text-amber-900' : 'border-zinc-200 bg-white text-zinc-700']">
            <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0', selectedServices.find(s => s.id === svc.id) ? 'border-amber-500 bg-amber-500' : 'border-zinc-300']"><div v-if="selectedServices.find(s => s.id === svc.id)" class="w-2 h-2 bg-white rounded-full"></div></div>
            <div class="flex-1 flex justify-between items-center"><div><p class="text-xs font-bold uppercase">{{ svc.name }}</p><p class="text-[10px] text-zinc-500">Kategori {{ svc.category }}</p></div><p class="text-xs font-black text-amber-600">+ {{ formatRupiah(svc.price) }}</p></div>
          </button>
        </div>
        <div class="bg-zinc-900 text-white p-4 rounded-2xl flex justify-between items-center mb-4"><span class="text-xs font-bold">Total</span><span class="text-lg font-black">{{ formatRupiah(totalPrice) }}</span></div>
        <button @click="addToCartWithOptions" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition shadow-lg">Masukkan ke Keranjang</button>
      </div>
    </div>

    <div v-if="showCategorySheet" class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl p-5 pb-8 shadow-2xl max-h-[80vh] flex flex-col">
        <div class="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4"></div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-black text-base text-zinc-900">Pilih Kategori</h3>
          <button @click="showCategorySheet=false" class="p-2 bg-zinc-100 rounded-xl"><X :size="18"/></button>
        </div>
        <div class="relative mb-4">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"/>
          <input v-model="categorySearch" placeholder="Cari kategori..." class="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900"/>
        </div>
        <div class="overflow-auto flex-1 space-y-2 pr-1">
          <button v-for="cat in filteredSheetCategories" :key="cat" @click="selectCategory(cat)" :class="['w-full text-left px-4 py-3.5 rounded-2xl border flex justify-between items-center transition', productStore.selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-zinc-200 text-zinc-700']">
            <span class="text-sm font-bold">{{ cat }}</span><span v-if="productStore.selectedCategory === cat" class="text-xs">✓</span>
          </button>
        </div>
        <button @click="showCategorySheet=false" class="w-full mt-4 bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm">Tutup</button>
      </div>
    </div>

    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-full opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-full opacity-0">
      <div v-if="cartStore.totalItems > 0" class="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto">
        <div class="bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-zinc-800">
          <div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold">{{ cartStore.totalItems }}</div><div><p class="text-[11px] text-zinc-400 uppercase font-semibold">Total Belanja</p><p class="text-sm font-black">{{ formatRupiah(cartStore.totalPrice) }}</p></div></div>
          <router-link to="/cart" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-md"><span>Lihat Keranjang</span><ArrowRight :size="16" /></router-link>
        </div>
      </div>
    </transition>
  </div>
</template>