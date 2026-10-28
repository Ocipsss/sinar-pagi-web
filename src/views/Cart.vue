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
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
            <ArrowLeft :size="20" />
          </router-link>
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">Keranjang Belanja</h1>
        </div>
        <span class="text-sm text-gray-500 font-medium">{{ cartStore.totalItems }} item</span>
      </div>
    </header>

    <main class="max-w-4xl mx-auto p-4">
      <div v-if="cartStore.items.length === 0" class="text-center py-20 flex flex-col items-center">
        <ShoppingBag :size="48" class="text-gray-300 mb-2" />
        <p class="text-gray-500 font-medium mb-4">Keranjang belanja kamu masih kosong</p>
        <router-link to="/" class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
          Mulai Belanja
        </router-link>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div class="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <div v-for="item in cartStore.items" :key="item.id" class="flex items-center justify-between gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
            <div class="flex items-center gap-3">
              <div class="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                <img v-if="item.imageUrl" :src="getThumbUrl(item.imageUrl, 200)" :alt="item.name" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag :size="20" />
                </div>
              </div>
              <div>
                <h2 class="font-semibold text-gray-800 text-sm line-clamp-1">{{ item.name }}</h2>
                <p v-if="item.note" class="text-[10px] text-amber-600 font-medium">{{ item.note }}</p>
                <p class="text-blue-600 font-bold text-sm">{{ formatRupiah(item.price_sell) }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center bg-gray-100 rounded-xl p-1 gap-2">
                <button @click="cartStore.updateQty(item.id, item.qty - 1)" class="p-1 text-gray-600 hover:bg-white rounded-lg transition shadow-xs">
                  <Minus :size="14" />
                </button>
                <span class="text-sm font-bold text-gray-800 w-5 text-center">{{ item.qty }}</span>
                <button @click="cartStore.updateQty(item.id, item.qty + 1)" class="p-1 text-gray-600 hover:bg-white rounded-lg transition shadow-xs">
                  <Plus :size="14" />
                </button>
              </div>

              <button @click="cartStore.removeFromCart(item.id)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer v-if="cartStore.items.length > 0" class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 shadow-lg z-30">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p class="text-xs text-gray-500 font-medium">Total Pembayaran</p>
          <p class="text-lg font-extrabold text-blue-600">{{ formatRupiah(cartStore.totalPrice) }}</p>
        </div>
        <router-link to="/checkout" class="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm">
          <span>Lanjut Checkout</span>
          <ArrowRight :size="18" />
        </router-link>
      </div>
    </footer>
  </div>
</template>
