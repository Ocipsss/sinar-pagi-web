<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { qrisService } from '../services/qrisService'
import { waService } from '../services/waService'
import { compressImage, uploadToCloudinary } from '../services/cloudinaryService'
import { formatRupiah } from '../utils/formatters'
import Modal from '../components/ui/Modal.vue'
import { ArrowLeft, User, MapPin, QrCode, Banknote, ShieldCheck, Upload, CheckCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const cartStore = useCartStore()

const customerName = ref('')
const customerAddress = ref('')
const paymentMethod = ref('COD')

const isPaymentModalOpen = ref(false)
const qrisSettings = ref({ qrisUrl: '', merchantName: 'WARUNG SINAR PAGI', nmid: '' })
const buktiFile = ref(null)
const buktiUrl = ref('')
const uploading = ref(false)
const loadingCheckout = ref(false)

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
    const res = await uploadToCloudinary(compressedBlob, 'sinar-pagi/bukti-bayar')
    buktiUrl.value = res.secure_url
    buktiFile.value = file.name
  } catch (err) {
    console.error('Gagal upload bukti bayar:', err)
    alert('Gagal mengunggah bukti pembayaran. Silakan coba lagi.')
  } finally {
    uploading.value = false
  }
}

async function handleCheckout() {
  if (!customerName.value.trim() || !customerAddress.value.trim()) {
    alert('Mohon isi Nama dan Alamat/Catatan pengiriman terlebih dahulu!')
    return
  }
  if (paymentMethod.value === 'QRIS' && !buktiUrl.value) {
    alert('Mohon upload bukti pembayaran QRIS terlebih dahulu!')
    return
  }

  loadingCheckout.value = true

  waService.sendOrderToWhatsApp(
    { name: customerName.value, address: customerAddress.value },
    cartStore.items,
    cartStore.totalPrice,
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
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
      <div class="max-w-4xl mx-auto flex items-center gap-3">
        <router-link to="/cart" class="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft :size="20" />
        </router-link>
        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Checkout Pesanan</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto p-4 flex flex-col gap-4">
      <div class="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
        <h2 class="font-bold text-gray-800 text-base">Informasi Pengiriman / Pemesan</h2>
        
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <User :size="14" class="text-blue-600" /> Nama Lengkap / Panggilan
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
            <MapPin :size="14" class="text-blue-600" /> Alamat / Patokan / Catatan
          </label>
          <textarea
            v-model="customerAddress"
            rows="3"
            placeholder="Contoh: RT 02/05 dekat warung / ambil langsung"
            class="w-full px-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-gray-800 text-base">Metode Pembayaran</h2>
          <button @click="isPaymentModalOpen = true" class="text-xs font-bold text-blue-600 hover:underline">
            Ubah Metode
          </button>
        </div>

        <div @click="isPaymentModalOpen = true" class="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100/50 transition">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-600 text-white rounded-xl">
              <Banknote v-if="paymentMethod === 'COD'" :size="20" />
              <QrCode v-else :size="20" />
            </div>
            <div>
              <p class="font-bold text-gray-800 text-sm">
                {{ paymentMethod === 'COD' ? 'Bayar di Tempat (COD)' : 'QRIS Instant' }}
              </p>
              <p class="text-xs text-gray-500">
                {{ paymentMethod === 'COD' ? 'Bayar tunai saat barang diterima' : 'Scan QRIS nasional via e-wallet / m-banking' }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="paymentMethod === 'QRIS'" class="flex flex-col gap-4 mt-2 pt-4 border-t border-gray-100">
          <div class="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-3">
            <div class="flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck :size="14" /> Pastikan: {{ qrisSettings.merchantName }}
            </div>
            
            <div class="w-48 h-48 bg-white rounded-xl p-2 shadow-xs border border-gray-200 flex items-center justify-center overflow-hidden">
              <img v-if="qrisSettings.qrisUrl" :src="qrisSettings.qrisUrl" alt="QRIS Warung Sinar Pagi" class="w-full h-full object-contain" />
              <p v-else class="text-xs text-gray-400">QRIS belum diset oleh admin</p>
            </div>

            <p class="text-xs text-gray-500">Scan QR dengan BCA, BRI, Dana, OVO, GoPay, dll.</p>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-gray-600">Upload Bukti Pembayaran QRIS</label>
            <div class="flex items-center gap-3">
              <label class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer text-sm font-medium transition border border-dashed border-gray-300">
                <Upload :size="16" class="text-blue-600" />
                <span>{{ buktiFile ? 'Ganti Bukti Bayar' : 'Pilih Foto Bukti Bayar' }}</span>
                <input type="file" accept="image/*" @change="handleFileChange" class="hidden" />
              </label>
            </div>
            <div v-if="uploading" class="flex items-center gap-2 text-xs text-blue-600 font-medium">
              <Loader2 :size="14" class="animate-spin" /> Mengompres & mengunggah gambar...
            </div>
            <div v-if="buktiUrl" class="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <CheckCircle :size="16" /> Bukti bayar berhasil diunggah!
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 shadow-lg z-30">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div>
          <p class="text-xs text-gray-500">Total Tagihan</p>
          <p class="text-lg font-extrabold text-blue-600">{{ formatRupiah(cartStore.totalPrice) }}</p>
        </div>
        <button
          @click="handleCheckout"
          :disabled="loadingCheckout"
          class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Loader2 v-if="loadingCheckout" :size="18" class="animate-spin" />
          <span>Kirim Pesanan ke WA</span>
        </button>
      </div>
    </footer>

    <Modal :isOpen="isPaymentModalOpen" title="Pilih Metode Pembayaran" @close="isPaymentModalOpen = false">
      <div class="flex flex-col gap-2 py-2">
        <button
          @click="paymentMethod = 'COD'; isPaymentModalOpen = false"
          class="flex items-center justify-between p-4 rounded-xl border transition text-left"
          :class="paymentMethod === 'COD' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'hover:bg-gray-50 border-gray-100 text-gray-800'"
        >
          <div class="flex items-center gap-3">
            <Banknote :size="20" class="text-blue-600" />
            <div>
              <p class="text-sm font-bold">Bayar di Tempat (COD)</p>
              <p class="text-xs text-gray-500 font-normal">Bayar tunai langsung saat barang diterima</p>
            </div>
          </div>
          <span v-if="paymentMethod === 'COD'" class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
        </button>

        <button
          @click="paymentMethod = 'QRIS'; isPaymentModalOpen = false"
          class="flex items-center justify-between p-4 rounded-xl border transition text-left"
          :class="paymentMethod === 'QRIS' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'hover:bg-gray-50 border-gray-100 text-gray-800'"
        >
          <div class="flex items-center gap-3">
            <QrCode :size="20" class="text-blue-600" />
            <div>
              <p class="text-sm font-bold">QRIS Instant</p>
              <p class="text-xs text-gray-500 font-normal">Scan QRIS nasional via e-wallet / m-banking</p>
            </div>
          </div>
          <span v-if="paymentMethod === 'QRIS'" class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
        </button>
      </div>
    </Modal>
  </div>
</template>
