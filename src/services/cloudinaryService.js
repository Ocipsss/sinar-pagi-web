// src/services/cloudinaryService.js - Sinar Pagi Web
import { compressImage } from '../utils/imageCompressor.js'

// Re-export agar kompatibilitas fungsi pembeli di Checkout.vue tetap aman tanpa merusak apa pun
export { compressImage }

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'vezqidog'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'sinarpagi-products'

/**
 * Upload ke Cloudinary - folder auto kebuat pas upload pertama
 * @param {Blob} imageBlob
 * @param {String} folder - 'sinar-pagi/products' | 'sinar-pagi/qris' | 'sinar-pagi/bukti-bayar'
 */
export async function uploadToCloudinary(imageBlob, folder = 'sinar-pagi/bukti-bayar') {
  const formData = new FormData()
  formData.append('file', imageBlob)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder) // INI YANG BIKIN AUTO FOLDER

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary Upload Failed: ${errorText}`)
  }
  const data = await response.json()
  return {
    secure_url: data.secure_url,
    public_id: data.public_id
  }
}

// HELPER BIAR GA SALAH FOLDER MET
export const uploadProductImage = (blob) => uploadToCloudinary(blob, 'sinar-pagi/products')
export const uploadQrisImage = (blob) => uploadToCloudinary(blob, 'sinar-pagi/qris')
export const uploadBuktiBayar = (blob) => uploadToCloudinary(blob, 'sinar-pagi/bukti-bayar')

export function getThumbUrl(publicIdOrUrl, width = 300) {
  if (!publicIdOrUrl) return ''
  if (!publicIdOrUrl.includes('res.cloudinary.com')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicIdOrUrl}`
  }
  return publicIdOrUrl.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`)
}

export function getFullUrl(publicIdOrUrl, width = 800) {
  if (!publicIdOrUrl) return ''
  if (!publicIdOrUrl.includes('res.cloudinary.com')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicIdOrUrl}`
  }
  return publicIdOrUrl.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`)
}
