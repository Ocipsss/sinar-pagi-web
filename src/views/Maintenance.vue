<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useHead } from '@vueuse/head'
import { Wrench, Clock, Instagram, MessageCircle } from 'lucide-vue-next'

// ============================================
// KONFIGURASI - GANTI SESUAI KEBUTUHAN
// ============================================
const MAINTENANCE_CONFIG = {
  // Tanggal selesai maintenance (WIB)
  endDate: new Date('2026-12-09T07:00:00+07:00'),
  
  // Info
  warungName: 'Warung Sinar Pagi',
  tagline: 'Sedang Dalam Perbaikan',
  description: 'Kami sedang melakukan peningkatan sistem agar pengalaman belanja kamu jadi lebih baik. Mohon tunggu sebentar ya! 🙏',
  
  // Kontak (opsional - set null untuk sembunyikan)
  waNumber: '6289516477760',
  waMessage: 'Halo, saya mau tanya-tanya soal Warung Sinar Pagi',
  instagram: null, // contoh: 'warungsinarpagi'
}

// ============================================
// COUNTDOWN LOGIC
// ============================================
const now = ref(Date.now())
let timer = null

const timeLeft = computed(() => {
  const diff = MAINTENANCE_CONFIG.endDate.getTime() - now.value
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true }
  }
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: false
  }
})

const pad = (n) => String(n).padStart(2, '0')

const waLink = computed(() => {
  if (!MAINTENANCE_CONFIG.waNumber) return null
  const phone = MAINTENANCE_CONFIG.waNumber.replace(/^0/, '62')
  return `https://wa.me/${phone}?text=${encodeURIComponent(MAINTENANCE_CONFIG.waMessage)}`
})

const igLink = computed(() => {
  if (!MAINTENANCE_CONFIG.instagram) return null
  return `https://instagram.com/${MAINTENANCE_CONFIG.instagram}`
})

// SEO
useHead({
  title: `${MAINTENANCE_CONFIG.warungName} - Maintenance`,
  meta: [
    { name: 'description', content: `${MAINTENANCE_CONFIG.warungName} sedang dalam perbaikan. Kembali lagi sebentar ya!` },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
    
    <!-- DECORATIVE BACKGROUND -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/3 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
      <div class="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-ping" style="animation-delay: 0.5s;"></div>
    </div>

    <!-- MAIN CARD -->
    <div class="relative w-full max-w-2xl">
      <div class="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl">
        
        <!-- ICON WRENCH ANIMATED -->
        <div class="flex justify-center mb-6">
          <div class="relative">
            <div class="absolute inset-0 bg-amber-500/30 rounded-full blur-2xl animate-pulse"></div>
            <div class="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl">
              <Wrench :size="40" class="text-white animate-[spin_3s_linear_infinite]" />
            </div>
          </div>
        </div>

        <!-- TEXT -->
        <div class="text-center mb-8">
          <p class="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] mb-2">
            {{ MAINTENANCE_CONFIG.tagline }}
          </p>
          <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            {{ MAINTENANCE_CONFIG.warungName }}
          </h1>
          <p class="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md mx-auto">
            {{ MAINTENANCE_CONFIG.description }}
          </p>
        </div>

        <!-- COUNTDOWN -->
        <div class="mb-8">
          <div class="flex items-center justify-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Clock :size="14" />
            <span v-if="!timeLeft.finished">Kembali dalam</span>
            <span v-else>Siap segera dibuka!</span>
          </div>

          <div v-if="!timeLeft.finished" class="grid grid-cols-4 gap-2 sm:gap-3">
            <div class="bg-white/[0.05] border border-white/10 rounded-2xl p-3 sm:p-4 text-center">
              <p class="text-2xl sm:text-4xl font-black text-white tabular-nums">{{ pad(timeLeft.days) }}</p>
              <p class="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase mt-1">Hari</p>
            </div>
            <div class="bg-white/[0.05] border border-white/10 rounded-2xl p-3 sm:p-4 text-center">
              <p class="text-2xl sm:text-4xl font-black text-white tabular-nums">{{ pad(timeLeft.hours) }}</p>
              <p class="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase mt-1">Jam</p>
            </div>
            <div class="bg-white/[0.05] border border-white/10 rounded-2xl p-3 sm:p-4 text-center">
              <p class="text-2xl sm:text-4xl font-black text-white tabular-nums">{{ pad(timeLeft.minutes) }}</p>
              <p class="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase mt-1">Menit</p>
            </div>
            <div class="bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500/50 rounded-2xl p-3 sm:p-4 text-center shadow-lg shadow-blue-600/20">
              <p class="text-2xl sm:text-4xl font-black text-white tabular-nums">{{ pad(timeLeft.seconds) }}</p>
              <p class="text-[10px] sm:text-xs text-blue-200 font-bold uppercase mt-1">Detik</p>
            </div>
          </div>

          <div v-else class="text-center">
            <p class="text-2xl font-black text-emerald-400">🎉 Maintenance Selesai!</p>
            <p class="text-xs text-zinc-500 mt-1">Silakan refresh halaman ini</p>
          </div>
        </div>

        <!-- CONTACT BUTTONS -->
        <div v-if="waLink || igLink" class="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            v-if="waLink"
            :href="waLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle :size="18" />
            Chat via WhatsApp
          </a>
          <a
            v-if="igLink"
            :href="igLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-sm transition active:scale-95"
          >
            <Instagram :size="18" />
            Instagram
          </a>
        </div>

        <!-- FOOTER -->
        <p class="text-center text-[11px] text-zinc-600 mt-8">
          &copy; {{ new Date().getFullYear() }} {{ MAINTENANCE_CONFIG.warungName }}
        </p>
      </div>
    </div>
  </div>
</template>