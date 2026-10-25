// src/services/cloudinaryService.js - Sinar Pagi Web
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'vezqidog'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'sinarpagi-products'

/**
 * Compress via Canvas 800px JPEG 70%
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 800
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Gagal kompres'))),
          'image/jpeg',
          0.7
        )
      }
      img.onerror = (err) => reject(err)
      img.src = event.target.result
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

/**
 * Upload ke Cloudinary (folder: sinar-pagi/products, sinar-pagi/qris, sinar-pagi/bukti-bayar)
 */
export async function uploadToCloudinary(imageBlob, folder = 'sinar-pagi/bukti-bayar') {
  const formData = new FormData()
  formData.append('file', imageBlob)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

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