// src/services/waService.js - FIX SPASI BIAR RAPIH PAS LANGSUNG KIRIM WA + HARGA JASA GA DOUBLE
export const waService = {
  sendOrderToWhatsApp(customer, items, total, paymentMethod, buktiUrl) {
    const phone = import.meta.env.VITE_WA_NUMBER || '6281234567890'
    
    const isDelivery = customer.deliveryType === 'delivery'
    const ongkir = Number(customer.deliveryFee) || 0
    const subtotal = total - ongkir

    const lines = []
    lines.push(`*PESANAN BARU - WARUNG SINAR PAGI*`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`👤 Nama: ${customer.name}`)
    lines.push(isDelivery ? `🚚 Opsi: Diantar` : `🏪 Opsi: Ambil di Warung`)
    lines.push(`📍 Alamat / Patokan: ${customer.address}`)
    if (customer.notes && customer.notes.trim()) {
      lines.push(`📝 Catatan: ${customer.notes.trim()}`)
    }
    lines.push(``)
    lines.push(`*RINCIAN PESANAN:*`)
    lines.push(``) // kasih jarak biar ga nempel

    items.forEach((item, idx) => {
      const qty = Number(item.qty || item.quantity || 1)
      const unitPrice = Number(item.price_sell) || 0
      const sub = unitPrice * qty

      // 1. Nama produk + qty - udah clean (1 BKS) doang tanpa 12 BATANG
      lines.push(`${idx + 1}. ${item.name} x${qty}`)
      
      // 2. Harga - udah include jasa
      if (qty > 1) {
        lines.push(`   ${qty} x ${fmt(unitPrice)} = ${fmt(sub)}`)
      } else {
        lines.push(`   ${fmt(sub)}`)
      }

      // 3. Jasa - FIX MET, jangan tampilin + Rp 2.000 lagi karena 4.500 udah include jasa
      // Cuma tampilin nama jasa nya aja biar tau opsi apa yang dipilih
      if (item.services && item.services.length > 0) {
        item.services.forEach(s => {
          lines.push(`   + ${s.name}`)
        })
      }

      if (item.note && !item.services?.length) {
        lines.push(`   > ${item.note}`)
      }

      lines.push(``) // INI KUNCINYA MET - SPASI 1 BARIS TIAP PRODUK
    })

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`Subtotal: ${fmt(subtotal)}`)
    lines.push(ongkir > 0 ? `Ongkir: ${fmt(ongkir)}` : `Ongkir: Gratis`)
    lines.push(`*Total: ${fmt(total)}*`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`💳 Bayar: ${paymentMethod}`)
    if (paymentMethod === 'QRIS' && buktiUrl) {
      lines.push(`📎 Bukti: ${buktiUrl}`)
    }
    lines.push(``)
    lines.push(`_Mohon konfirmasi ya kak_ 🙏`)

    const message = encodeURIComponent(lines.join('\n'))
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }
}

function fmt(n) {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(n || 0)
}