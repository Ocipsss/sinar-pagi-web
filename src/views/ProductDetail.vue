<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { getThumbUrl } from '../services/cloudinaryService'
import { formatRupiah } from '../utils/formatters'
import { buildCartItem } from '../utils/productHelper'
import { parseProductIdFromSlug, makeProductSlug } from '../utils/slugify'
import { useHead } from '@vueuse/head'
import { ArrowLeft, Package, ShoppingCart } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()

const product = ref(null)
const loading = ref(true)
const notFound = ref(false)

const productPackages = ref([])
const availableServices = ref([])
const selectedPackage = ref(null)
const selectedServices = ref([])

const totalPrice = computed(() => {
  if (!product.value) return 0
  let price = product.value.price_sell
  if (selectedPackage.value) price = selectedPackage.value.price_sell
  for (const svc of selectedServices.value) price += Number(svc.price) || 0
  return price
})

function toggleService(svc) {
  const exists = selectedServices.value.find(s => s.id === svc.id)
  if (exists) selectedServices.value = []
  else selectedServices.value = [svc]
}

onMounted(async () => {
  loading.value = true
  await productStore.loadProducts()
  
  const slugParam = route.params.slug || ''
  
  // TAHAP 6 FIX: CARI DENGAN 3 CARA BIAR GAK ADA YANG "TIDAK DITEMUKAN" LAGI
  let found = null
  
  // Cara 1: Cocok persis slug lengkap
  found = productStore.products.find(p => makeProductSlug(p) === slugParam)
  
  // Cara 2: Cari yang ID nya jadi akhiran slug (PALING AMAN, anti kepotong -)
  if (!found) {
    found = productStore.products.find(p => slugParam.endsWith(p.id))
  }
  
  // Cara 3: Fallback cara lama
  if (!found) {
    const id = parseProductIdFromSlug(slugParam)
    found = productStore.products.find(p => p.id === id)
  }
  
  if (!found) {
    notFound.value = true
    loading.value = false
    return
  }
  
  product.value = found

  // ambil paket & layanan dari IndexedDB (0 read)
  try {
    const pkgs = await productStore.fetchProductPackages(found.id)
    productPackages.value = pkgs.filter(p => {
      const name = (p.name || '').toUpperCase()
      return !['RENCENG','RENCENGAN','DUS','KARDUS'].some(bad => name.includes(bad)) && (p.qty_pcs || 0) !== 1
    }).sort((a,b) => (a.order ?? 999) - (b.order ?? 999))
  } catch {}
  try {
    const allServices = await productStore.fetchAllServices()
    const getIds = (s) => s.productIds?.length ? s.productIds : s.productId ? [s.productId] : []
    const custom = allServices.filter(s => getIds(s).includes(found.id))
    if (custom.length) availableServices.value = custom
    else {
      const cat = (found.category || '').toUpperCase()
      availableServices.value = allServices.filter(s => getIds(s).length === 0 && (s.category || '').toUpperCase() === cat)
    }
  } catch {}

  // SEO DYNAMIC
  const title = `${found.name} - Warung Sinar Pagi Ciheleut Bogor | Warkop & Sembako Diantar 2rb`
  const desc = `Beli ${found.name} di Warung Sinar Pagi Jl. Jagung Ujung No.38 Ciheleut Bogor Timur. ${found.category || ''} - Stok ready, buka 09.00-21.00, diantar 200m cuma Rp2.000 COD/QRIS. Harga ${formatRupiah(found.price_sell)}`
  const url = `https://warungsinarpagi.my.id/produk/${makeProductSlug(found)}`
  const image = found.imageUrl ? getThumbUrl(found.imageUrl, 600) : ''

  useHead({
    title,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: title },
      { property: 'og:description', content: desc },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'product' }
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": found.name,
          "image": found.imageUrl ? [found.imageUrl] : [],
          "description": desc,
          "sku": found.id,
          "brand": { "@type": "Brand", "name": "Warung Sinar Pagi" },
          "category": found.category,
          "offers": {
            "@type": "Offer",
            "url": url,
            "priceCurrency": "IDR",
            "price": found.price_sell,
            "priceValidUntil": new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            "availability": found.qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "Warung Sinar Pagi",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Jl. Jagung Ujung No.38 RT01/09",
                "addressLocality": "Ciheleut",
                "addressRegion": "Bogor",
                "postalCode": "16142"
              }
            }
          }
        })
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Beranda", "item": "https://warungsinarpagi.my.id/" },
            { "@type": "ListItem", "position": 2, "name": found.category || "Produk", "item": `https://warungsinarpagi.my.id/#${found.category}` },
            { "@type": "ListItem", "position": 3, "name": found.name }
          ]
        })
      }
    ]
  })

  loading.value = false
})

function addToCart() {
  if (!product.value) return
  const item = buildCartItem(product.value, selectedServices.value, totalPrice.value, selectedPackage.value)
  cartStore.addToCart(item, 1)
  router.push('/cart')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 md:px-6 py-4">
      <button @click="router.push('/')" class="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft :size="18" /> Kembali ke Katalog
      </button>

      <div v-if="loading" class="py-20 flex justify-center"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      <div v-else-if="notFound" class="py-20 text-center bg-white rounded-3xl border">
        <Package :size="48" class="mx-auto text-gray-300 mb-2" />
        <p class="font-bold">Produk tidak ditemukan</p>
        <p class="text-xs text-gray-500 mt-1">Coba clear cache / reload</p>
        <router-link to="/" class="text-blue-600 text-sm font-bold mt-2 inline-block">Ke Katalog</router-link>
      </div>

      <div v-else-if="product" class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm">
          <div class="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            <img v-if="product.imageUrl" :src="getThumbUrl(product.imageUrl, 600)" :alt="product.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400"><Package :size="64" /></div>
          </div>
        </div>
        <div class="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <span class="text-[11px] font-bold bg-gray-900 text-white px-3 py-1 rounded-full">{{ product.category || 'UMUM' }}</span>
          <h1 class="text-2xl md:text-3xl font-black text-gray-900 mt-3 leading-tight">{{ product.name }}</h1>
          <p class="text-sm text-gray-500 mt-2">Stok: {{ product.qty }} {{ product.unit || 'PCS' }} • Di Warung Sinar Pagi Ciheleut - Jl. Jagung Ujung No.38, Buka 09.00-21.00, Antar 200m Rp2rb</p>
          <p class="text-3xl font-black text-blue-600 mt-4">{{ formatRupiah(totalPrice) }}</p>

          <div v-if="productPackages.length" class="mt-6 space-y-2">
            <label class="text-[10px] font-bold uppercase text-zinc-400">Pilih Paket</label>
            <button @click="selectedPackage = null" :class="['w-full p-3 rounded-2xl border flex justify-between', !selectedPackage ? 'border-blue-600 bg-blue-50' : 'border-zinc-200']">
              <span class="text-xs font-bold">Eceran</span><span class="text-sm font-black text-blue-600">{{ formatRupiah(product.price_sell) }}</span>
            </button>
            <button v-for="pkg in productPackages" :key="pkg.id" @click="selectedPackage = pkg" :class="['w-full p-3 rounded-2xl border flex justify-between', selectedPackage?.id === pkg.id ? 'border-emerald-600 bg-emerald-50' : 'border-zinc-200']">
              <span class="text-xs font-bold">{{ pkg.name }}</span><span class="text-sm font-black text-emerald-600">{{ formatRupiah(pkg.price_sell) }}</span>
            </button>
          </div>

          <div v-if="availableServices.length" class="mt-6 space-y-2">
            <label class="text-[10px] font-bold uppercase text-zinc-400">Opsi Penyajian ({{ product.category }})</label>
            <button v-for="svc in availableServices" :key="svc.id" @click="toggleService(svc)" :class="['w-full p-3 rounded-2xl border text-left flex justify-between', selectedServices.find(s=>s.id===svc.id) ? 'border-amber-500 bg-amber-50' : 'border-zinc-200']">
              <span class="text-xs font-bold">{{ svc.name }}</span><span class="text-xs font-black text-amber-600">+{{ formatRupiah(svc.price) }}</span>
            </button>
          </div>

          <button @click="addToCart" class="w-full mt-8 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
            <ShoppingCart :size="18" /> Masukkan ke Keranjang
          </button>

          <div class="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-700 leading-relaxed">
            <b>Warung Sinar Pagi</b> - Jl. Jagung Ujung No.38 RT01/09 Ciheleut, Bogor Timur dekat Unpak & Komplek IPB. Buka 09.00-21.00. Bisa makan di tempat, ambil gratis, atau diantar 200m cuma Rp2.000. Bayar COD/QRIS.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>