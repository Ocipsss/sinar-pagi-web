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
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
    <!-- CARD UTAMA KONTINER DENGAN ANIMASI FADE/ZOOM DAN TAMPILAN RAPI DI LAYAR LEBAR -->
    <div class="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 max-w-md w-full text-center flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
      
      <!-- ICON CHECKMARK BERWARNA HIJAU -->
      <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-inner">
        <CheckCircle :size="44" />
      </div>

      <!-- TEKS INFORMASI SUKSES -->
      <div class="space-y-2">
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Pesanan Berhasil Dikirim!</h1>
        <p class="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
          Pesanan kamu sudah diteruskan via WhatsApp ke Warung Sinar Pagi. Admin kami akan segera memproses dan merespons pesananmu.
        </p>
      </div>

      <!-- TOMBOL KEMBALI KE KATALOG -->
      <router-link 
        to="/" 
        class="mt-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
      >
        <Home :size="18" />
        <span>Kembali ke Katalog</span>
      </router-link>

    </div>
  </div>
</template>
