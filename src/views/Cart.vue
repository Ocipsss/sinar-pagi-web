<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { getThumbUrl } from '../services/cloudinaryService'
import { formatRupiah } from '../utils/formatters'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-vue-next'

const cartStore = useCartStore()

onMounted(async () => {
  await cartStore.loadCart()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-28">
    <!-- HEADER STICKY RESPONSIF -->
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 lg:px-8 py-3.5 shadow-xs">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer">
            <ArrowLeft :size="20" />
          </router-link>
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">Keranjang Belanja</h1>
        </div>
        <span class="text-sm text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full">{{ cartStore.totalItems }} item</span>
      </div>
    </header>

    <!-- MAIN CONTENT KONTINER DI TENGAH LAYAR -->
    <main class="max-w-4xl mx-auto p-4 md:p-6">
      <!-- TAMPILAN JIKA KERANJANG KOSONG -->
      <div v-if="cartStore.items.length === 0" class="text-center py-20 flex flex-col items-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <ShoppingBag :size="40" />
        </div>
        <h2 class="text-lg font-bold text-gray-800">Keranjang Belanja Kosong</h2>
        <p class="text-sm text-gray-500 font-medium mb-6 mt-1 max-w-sm">Kamu belum menambahkan produk apa pun ke keranjang belanja.</p>
        <router-link to="/" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95 cursor-pointer">
          Mulai Belanja
        </router-link>
      </div>

      <!-- DAFTAR ITEM KERANJANG -->
      <div v-else class="flex flex-col gap-4">
        <div class="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-gray-100 flex flex-col gap-4">
          <div v-for="item in cartStore.items" :key="item.id" class="flex items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <!-- DETAIL INFORMASI ITEM -->
            <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                <img v-if="item.imageUrl" :src="getThumbUrl(item.imageUrl, 200)" :alt="item.name" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag :size="24" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="font-bold text-gray-800 text-sm sm:text-base truncate">{{ item.name }}</h2>
                <p v-if="item.note" class="text-[11px] sm:text-xs text-amber-600 font-bold mt-0.5">+ {{ item.note }}</p>
                <p class="text-blue-600 font-black text-sm sm:text-base mt-1">{{ formatRupiah(item.price_sell) }}</p>
              </div>
            </div>

            <!-- KONTROL QTY & HAPUS -->
            <div class="flex items-center gap-2 sm:gap-4 shrink-0">
              <div class="flex items-center bg-gray-100/80 border border-gray-200/60 rounded-xl p-1 gap-1 sm:gap-2">
                <button @click="cartStore.updateQty(item.id, item.qty - 1)" class="p-1.5 text-gray-600 hover:bg-white rounded-lg transition shadow-xs cursor-pointer active:scale-95">
                  <Minus :size="14" />
                </button>
                <span class="text-sm font-black text-gray-800 w-6 text-center select-none">{{ item.qty }}</span>
                <button @click="cartStore.updateQty(item.id, item.qty + 1)" class="p-1.5 text-gray-600 hover:bg-white rounded-lg transition shadow-xs cursor-pointer active:scale-95">
                  <Plus :size="14" />
                </button>
              </div>

              <button @click="cartStore.removeFromCart(item.id)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer active:scale-95" title="Hapus Item">
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- FOOTER STICKY DENGAN MAX-WIDTH RAPI DI TABLET & DESKTOP -->
    <footer v-if="cartStore.items.length > 0" class="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-2xl z-30">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p class="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Pembayaran</p>
          <p class="text-lg sm:text-xl font-black text-blue-600">{{ formatRupiah(cartStore.totalPrice) }}</p>
        </div>
        <router-link to="/checkout" class="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md active:scale-95 cursor-pointer">
          <span>Lanjut Checkout</span>
          <ArrowRight :size="18" />
        </router-link>
      </div>
    </footer>
  </div>
</template>
