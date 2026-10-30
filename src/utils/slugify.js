export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function makeProductSlug(product) {
  return `${slugify(product.name)}-${product.id}`
}

export function parseProductIdFromSlug(slug) {
  if (!slug) return null
  const parts = slug.split('-')
  return parts[parts.length - 1]
}