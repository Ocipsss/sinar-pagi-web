/**
 * Utility Kompresi Gambar via Canvas (800px JPEG 70%)
 * @param {File} file 
 * @returns {Promise<Blob>}
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
