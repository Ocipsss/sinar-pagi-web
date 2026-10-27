<script setup>
import { CheckCircle, Home } from 'lucide-vue-next'
import { useCartStore } from '../stores/cartStore'
import { onMounted } from 'vue'

const cartStore = useCartStore()

onMounted(async () => {
  await cartStore.clearCart()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 max-w-md w-full text-center flex flex-col items-center gap-4">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
        <CheckCircle :size="36" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Pesanan Berhasil Dikirim!</h1>
      <p class="text-sm text-gray-500 leading-relaxed">
        Pesanan kamu sudah diteruskan via WhatsApp ke Warung Sinar Pagi. Admin kami akan segera memproses pesananmu.
      </p>

      <router-link to="/" class="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
        <Home :size="18" />
        <span>Kembali ke Katalog</span>
      </router-link>
    </div>
  </div>
</template>
