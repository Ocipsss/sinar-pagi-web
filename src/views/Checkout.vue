<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { qrisService } from '../services/qrisService'
import { waService } from '../services/waService'
import { compressImage, uploadBuktiBayar } from '../services/cloudinaryService'
import { formatRupiah } from '../utils/formatters'
import { ArrowLeft, User, MapPin, QrCode, Banknote, ShieldCheck, Upload, CheckCircle, Loader2, Store, Bike, Download, Maximize2, X, StickyNote } from 'lucide-vue-next'

const router = useRouter()
const cartStore = useCartStore()

const customerName = ref('')
const customerAddress = ref('') // Alamat / Patokan WAJIB
const customerNotes = ref('') // Catatan / Notes OPSIONAL
const paymentMethod = ref('COD')
const deliveryType = ref('pickup') // pickup | delivery

const isQrisFullscreen = ref(false)
const qrisSettings = ref({ qrisUrl: '', merchantName: 'WARUNG SINAR PAGI', nmid: '' })
const buktiFile = ref(null)
const buktiUrl = ref('')
const uploading = ref(false)
const loadingCheckout = ref(false)

const DELIVERY_FEE = 2000

const deliveryFee = computed(() => deliveryType.value === 'delivery' ? DELIVERY_FEE : 0)
const finalTotal = computed(() => cartStore.totalPrice + deliveryFee.value)

onMounted(async () => {
  await cartStore.loadCart()
  const remote = await qrisService.fetchRemoteSettings()
  if (remote) qrisSettings.value = remote
})

async function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const compressedBlob = await compressImage(file)
    // INI KUNCINYA MET -> OTOMATIS MASUK FOLDER sinar-pagi/bukti-bayar
    const res = await uploadBuktiBayar(compressedBlob)
    buktiUrl.value = res.secure_url
    buktiFile.value = file.name
  } catch (err) {
    console.error('Gagal upload bukti bayar:', err)
    alert('Gagal mengunggah bukti pembayaran. Silakan coba lagi.')
  } finally {
    uploading.value = false
  }
}

async function downloadQris() {
  if (!qrisSettings.value.qrisUrl) return
  try {
    const res = await fetch(qrisSettings.value.qrisUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `QRIS-${qrisSettings.value.merchantName || 'SinarPagi'}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    window.open(qrisSettings.value.qrisUrl, '_blank')
  }
}

async function handleCheckout() {
  if (!customerName.value.trim()) {
    alert('Mohon isi Nama Lengkap terlebih dahulu!')
    return
  }
  if (!customerAddress.value.trim()) {
    alert('Mohon isi Alamat / Patokan terlebih dahulu!')
    return
  }
  if (paymentMethod.value === 'QRIS' && !buktiUrl.value) {
    alert('Mohon upload bukti pembayaran QRIS terlebih dahulu!')
    return
  }

  loadingCheckout.value = true

  waService.sendOrderToWhatsApp(
    { 
      name: customerName.value, 
      address: customerAddress.value,
      notes: customerNotes.value,
      deliveryType: deliveryType.value,
      deliveryFee: deliveryFee.value
    },
    cartStore.items,
    finalTotal.value,
    paymentMethod.value,
    buktiUrl.value
  )

  setTimeout(() => {
    loadingCheckout.value = false
    router.push('/checkout-success')
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-28">
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 lg:px-8 py-3 shadow-xs">
      <div class="max-w-7xl mx-auto flex items-center gap-3">
        <router-link to="/cart" class="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft :size="20" />
        </router-link>
        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Checkout Pesanan</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 md:p-6">
      <!-- CONTAINER LAYOUT 2 KOLOM DI LAYAR DESKTOP / TABLET LEBAR (lg:) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- KOLOM KIRI (7 KOLOM): FORM INPUT PEMESAN, OPSI PENGAMBILAN & PEMBAYARAN -->
        <div class="lg:col-span-7 flex flex-col gap-4">
          
          <!-- OPSI PENGAMBILAN -->
          <div class="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
            <h2 class="font-bold text-gray-800 text-base">Opsi Pengambilan</h2>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="deliveryType = 'pickup'"
                :class="['p-3.5 rounded-xl border flex flex-col items-start gap-1.5 transition text-left cursor-pointer', deliveryType === 'pickup' ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50']"
              >
                <Store :size="20" :class="deliveryType === 'pickup' ? 'text-white' : 'text-zinc-900'" />
                <div>
                  <p class="text-xs font-black uppercase">Ambil di Warung</p>
                  <p :class="['text-[11px]', deliveryType === 'pickup' ? 'text-zinc-300' : 'text-zinc-500']">Gratis • Tanpa ongkir</p>
                </div>
              </button>
              <button 
                @click="deliveryType = 'delivery'"
                :class="['p-3.5 rounded-xl border flex flex-col items-start gap-1.5 transition text-left cursor-pointer', deliveryType === 'delivery' ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-md' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50']"
              >
                <Bike :size="20" :class="deliveryType === 'delivery' ? 'text-amber-600' : 'text-zinc-900'" />
                <div>
                  <p class="text-xs font-black uppercase">Diantar</p>
                  <p :class="['text-[11px] font-bold', deliveryType === 'delivery' ? 'text-amber-700' : 'text-zinc-500']">+ {{ formatRupiah(DELIVERY_FEE) }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- INFORMASI PEMESANAN -->
          <div class="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
            <h2 class="font-bold text-gray-800 text-base">Informasi Pemesanan</h2>
            
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <User :size="14" class="text-blue-600" /> Nama Lengkap *
              </label>
              <input
                v-model="customerName"
                type="text"
                placeholder="Contoh: Bpk. Budi"
                class="w-full px-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 outline-none"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <MapPin :size="14" class="text-blue-600" /> Alamat / Patokan *
              </label>
              <textarea
                v-model="customerAddress"
                rows="3"
                placeholder="Contoh: RT 02/05 Jl. Sinar Pagi No 10, patokan warung sebelah"
                class="w-full px-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 outline-none resize-none"
              ></textarea>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <StickyNote :size="14" class="text-blue-600" /> Catatan / Notes <span class="font-normal text-gray-400">(Opsional)</span>
              </label>
              <textarea
                v-model="customerNotes"
                rows="3"
                placeholder="Contoh: es batu jangan terlalu banyak, saos dikit aja, mie setengah mateng dll"
                class="w-full px-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 outline-none resize-none"
              ></textarea>
              <p class="text-[10px] text-zinc-400">Contoh: es batu jangan terlalu banyak, saos dikit aja, dll</p>
            </div>
          </div>

          <!-- METODE PEMBAYARAN -->
          <div class="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
            <h2 class="font-bold text-gray-800 text-base">Metode Pembayaran</h2>

            <div class="flex flex-col gap-2">
              <button 
                @click="paymentMethod = 'COD'"
                :class="['p-3.5 rounded-xl border flex items-center justify-between gap-3 transition text-left cursor-pointer', paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50']"
              >
                <div class="flex items-center gap-3">
                  <div :class="['p-2 rounded-xl', paymentMethod === 'COD' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600']">
                    <Banknote :size="20" />
                  </div>
                  <div>
                    <p class="text-xs font-black">Bayar di Tempat (COD)</p>
                    <p class="text-[11px] text-zinc-500 leading-tight">Bayar tunai saat diterima/diambil</p>
                  </div>
                </div>
                <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', paymentMethod === 'COD' ? 'border-blue-600 bg-blue-600' : 'border-zinc-300']">
                  <div v-if="paymentMethod === 'COD'" class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </button>
              <button 
                @click="paymentMethod = 'QRIS'"
                :class="['p-3.5 rounded-xl border flex items-center justify-between gap-3 transition text-left cursor-pointer', paymentMethod === 'QRIS' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50']"
              >
                <div class="flex items-center gap-3">
                  <div :class="['p-2 rounded-xl', paymentMethod === 'QRIS' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600']">
                    <QrCode :size="20" />
                  </div>
                  <div>
                    <p class="text-xs font-black">QRIS</p>
                    <p class="text-[11px] text-zinc-500 leading-tight">Scan e-wallet / m-banking</p>
                  </div>
                </div>
                <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', paymentMethod === 'QRIS' ? 'border-emerald-600 bg-emerald-600' : 'border-zinc-300']">
                  <div v-if="paymentMethod === 'QRIS'" class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </button>
            </div>

            <div v-if="paymentMethod === 'QRIS'" class="flex flex-col gap-4 mt-1 pt-4 border-t border-dashed border-gray-200">
              <div class="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-3">
                <div class="flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck :size="14" /> Pastikan: {{ qrisSettings.merchantName }}
                </div>
                
                <div @click="isQrisFullscreen = true" class="relative w-full max-w-[320px] bg-white rounded-2xl p-3 shadow-sm border border-gray-200 flex items-center justify-center cursor-zoom-in group overflow-hidden">
                  <img v-if="qrisSettings.qrisUrl" :src="qrisSettings.qrisUrl" alt="QRIS" class="w-full h-auto object-contain rounded-xl" />
                  <p v-else class="text-xs text-gray-400 py-10">QRIS belum diset oleh admin</p>
                  <div class="absolute top-2.5 right-2.5 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition">
                    <Maximize2 :size="16" />
                  </div>
                </div>
                
                <p class="text-xs text-gray-500">Tap gambar untuk fullscreen • Scan dengan BCA, BRI, Dana, OVO, GoPay, dll.</p>

                <button @click="downloadQris" class="w-full max-w-[320px] flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black active:scale-95 transition shadow-md hover:bg-black cursor-pointer">
                  <Download :size="16" /> Download QRIS
                </button>
                <p class="text-[10px] text-zinc-400 max-w-[320px] leading-tight">Kalo cuma punya 1 HP: Download dulu, baru buka e-wallet > Bayar > Pilih dari Galeri / Upload QRIS</p>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-semibold text-gray-600">Upload Bukti Pembayaran QRIS *</label>
                <label class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer text-sm font-medium transition border border-dashed border-gray-300">
                  <Upload :size="16" class="text-blue-600" />
                  <span>{{ buktiFile ? 'Ganti Bukti Bayar' : 'Pilih Foto Bukti Bayar' }}</span>
                  <input type="file" accept="image/*" @change="handleFileChange" class="hidden" />
                </label>
                <div v-if="uploading" class="flex items-center gap-2 text-xs text-blue-600 font-medium">
                  <Loader2 :size="14" class="animate-spin" /> Mengunggah...
                </div>
                <div v-if="buktiUrl" class="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <CheckCircle :size="16" /> Bukti bayar berhasil diunggah!
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- KOLOM KANAN (5 KOLOM): RINGKASAN BIAYA & BUTTON DESKTOP (STICKY) -->
        <div class="lg:col-span-5 sticky top-20 flex flex-col gap-4">
          <div class="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-3">
            <h2 class="font-bold text-gray-800 text-base mb-2">Rincian Biaya</h2>
            <div class="flex justify-between text-xs text-zinc-600">
              <span>Subtotal ({{ cartStore.totalItems }} item)</span>
              <span>{{ formatRupiah(cartStore.totalPrice) }}</span>
            </div>
            <div class="flex justify-between text-xs" :class="deliveryFee > 0 ? 'text-amber-600 font-bold' : 'text-zinc-400'">
              <span>Ongkir ({{ deliveryType === 'delivery' ? 'Diantar' : 'Ambil di Warung' }})</span>
              <span>{{ deliveryFee > 0 ? formatRupiah(deliveryFee) : 'Gratis' }}</span>
            </div>
            <div class="border-t border-dashed pt-3 flex justify-between font-black text-base">
              <span>Total Tagihan</span>
              <span class="text-blue-600">{{ formatRupiah(finalTotal) }}</span>
            </div>

            <!-- TOMBOL UNTUK DESKTOP / TABLET (TAMPIL HANYA DI lg:) -->
            <button
              @click="handleCheckout"
              :disabled="loadingCheckout"
              class="hidden lg:flex mt-4 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Loader2 v-if="loadingCheckout" :size="18" class="animate-spin" />
              <span>Kirim Pesanan ke WA</span>
            </button>
          </div>
        </div>

      </div>
    </main>

    <!-- FOOTER FLOATING UNTUK MOBILE HP (< lg) -->
    <footer class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 shadow-lg z-30">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p class="text-xs text-gray-500">Total Tagihan</p>
          <p class="text-lg font-extrabold text-blue-600">{{ formatRupiah(finalTotal) }}</p>
          <p v-if="deliveryFee > 0" class="text-[10px] text-amber-600 font-bold">Termasuk ongkir {{ formatRupiah(deliveryFee) }}</p>
        </div>
        <button
          @click="handleCheckout"
          :disabled="loadingCheckout"
          class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Loader2 v-if="loadingCheckout" :size="18" class="animate-spin" />
          <span>Kirim Pesanan ke WA</span>
        </button>
      </div>
    </footer>

    <!-- MODAL QRIS FULLSCREEN -->
    <div v-if="isQrisFullscreen" @click="isQrisFullscreen = false" class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <button @click="isQrisFullscreen = false" class="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"><X :size="24" /></button>
      <img :src="qrisSettings.qrisUrl" class="max-w-full max-h-[80vh] object-contain rounded-2xl bg-white p-2 shadow-2xl" @click.stop />
      <button @click.stop="downloadQris" class="mt-6 px-6 py-3.5 bg-white text-zinc-900 rounded-full font-black text-xs flex items-center gap-2 shadow-xl active:scale-95 cursor-pointer"><Download :size="16" /> Download QRIS</button>
    </div>
  </div>
</template>
