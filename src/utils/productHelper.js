export function buildCartItem(product, selectedServices = [], finalPrice = null, selectedPackage = null) {
  let finalUnit = product.unit || 'PCS'
  let displayName = product.name
  let notes = []

  if (selectedPackage) {
    if (selectedPackage.id) {
      finalUnit = selectedPackage.name || product.purchasePackName || 'PAKET'
      displayName = `${product.name} (${selectedPackage.name})`
      if (selectedPackage.qty_pcs) {
        displayName += ` ${selectedPackage.qty_pcs} ${product.unit || 'PCS'}`
      }
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
    price_sell: priceToUse,
    imageUrl: product.imageUrl,
    category: product.category,
    unit: finalUnit,
    note: notes.join(', '),
    services: selectedServices || [],
    packageId: selectedPackage?.id || null,
    qty: product.qty
  }
}

const getServiceIds = (s) => {
  if (s.productIds && Array.isArray(s.productIds)) return s.productIds
  if (s.productId) return [s.productId]
  return []
}

export function getServicesForProduct(product, allServices = []) {
  if (!product) return []
  const custom = allServices.filter(s => getServiceIds(s).includes(product.id))
  if (custom.length > 0) return custom

  const pCat = (product.category || '').toUpperCase()
  return allServices.filter(s => {
    const ids = getServiceIds(s)
    return ids.length === 0 && (s.category || '').toUpperCase() === pCat
  })
}

export function hasProductOptions(product, packages = [], services = []) {
  const hasLegacyPack = (product.packPrice || 0) > 0
  return packages.length > 0 || services.length > 0 || hasLegacyPack
}