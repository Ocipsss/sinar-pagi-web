// src/utils/productHelper.js - FIX JASA KHUSUS GA BOCOR KE UMUM + NAMA ROKOK CLEAN

const getServiceIds = (s) => {
  if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
  if (s.productId) return [s.productId]
  return []
}

export function buildCartItem(product, selectedServices = [], finalPrice = null, selectedPackage = null) {
  let finalUnit = product.unit || 'PCS'
  let displayName = product.name
  let notes = []

  if (selectedPackage) {
    if (selectedPackage.id) {
      finalUnit = selectedPackage.name || product.purchasePackName || 'PAKET'
      // FIX MET - CUMAN (1 BKS) DOANG, GA USAH 12 BATANG LAGI
      displayName = `${product.name} (${selectedPackage.name})`
    } else if (typeof selectedPackage === 'object' && selectedPackage.name) {
      finalUnit = selectedPackage.name
      displayName = `${product.name} (${selectedPackage.name})`
    }
  }

  if (Array.isArray(selectedServices) && selectedServices.length > 0) {
    notes = selectedServices.map(s => s.name)
  }

  const priceToUse = finalPrice != null ? finalPrice : product.price_sell

  return {
    id: product.id,
    name: displayName,
    originalName: product.name,
    price_sell: Number(priceToUse) || 0,
    imageUrl: product.imageUrl,
    category: product.category,
    unit: finalUnit,
    note: notes.join(', '),
    // CLONE PLAIN BIAR GA DataCloneError DI INDEXEDDB
    services: JSON.parse(JSON.stringify(selectedServices || [])),
    packageId: selectedPackage?.id || null,
    qty: product.qty
  }
}

export function getServicesForProduct(product, allServices = []) {
  if (!product) return []
  const list = allServices.filter(s => !s.deleted)
  const pCat = (product.category || '').toUpperCase()

  // 1. Cari yang khusus buat produk ini (support multi)
  const custom = list.filter(s => {
    const ids = getServiceIds(s)
    return ids.length > 0 && ids.includes(product.id)
  })
  // Kalo ada khusus, CUMA khusus yang keluar, umum HILANG
  if (custom.length > 0) return custom

  // 2. Kalo ga ada khusus, baru umum yang ids nya kosong beneran
  return list.filter(s => {
    const ids = getServiceIds(s)
    return ids.length === 0 && (s.category || '').toUpperCase() === pCat
  })
}

export function hasProductOptions(product, packages = [], services = []) {
  const hasLegacyPack = (product.packPrice || 0) > 0
  return packages.length > 0 || services.length > 0 || hasLegacyPack
}