const WA_PHONE = '6289516477760'

export const waService = {
  buildOrderMessage(customerData, cartItems, totalPrice, paymentMethod, buktiUrl = '') {
    let message = `Halo Warung Sinar Pagi, saya mau pesan:\n\n`

    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} (${item.qty}x) - Rp${(item.price_sell * item.qty).toLocaleString('id-ID')}\n`
    })

    message += `\n*Total Belanja: Rp${totalPrice.toLocaleString('id-ID')}*\n\n`
    message += `*Data Pemesan:*\n`
    message += `Nama: ${customerData.name}\n`
    message += `Alamat/Catatan: ${customerData.address}\n`
    message += `Metode Pembayaran: ${paymentMethod}\n`

    if (paymentMethod === 'QRIS' && buktiUrl) {
      message += `Bukti Bayar: ${buktiUrl}\n`
    }

    message += `\nMohon segera diproses ya, terima kasih!`
    return message
  },

  sendOrderToWhatsApp(customerData, cartItems, totalPrice, paymentMethod, buktiUrl = '') {
    const message = this.buildOrderMessage(customerData, cartItems, totalPrice, paymentMethod, buktiUrl)
    const encoded = encodeURIComponent(message)
    const url = `https://wa.me/${WA_PHONE}?text=${encoded}`
    window.open(url, '_blank')
  }
}
