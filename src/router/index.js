import { createRouter, createWebHistory } from 'vue-router'
import Catalog from '../views/Catalog.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import CheckoutSuccess from '../views/CheckoutSuccess.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Maintenance from '../views/Maintenance.vue'

// ============================================
// MAINTENANCE MODE — DIEVALUASI SETIAP NAVIGASI
// Priority:
//   1. .env (VITE_MAINTENANCE_MODE=true) → production
//   2. localStorage (maintenance_mode=true) → toggle instant
// ============================================
function isMaintenanceMode() {
  // Priority 1: Environment variable (production)
  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
    return true
  }

  // Priority 2: localStorage (dev/testing — toggle tanpa rebuild)
  try {
    if (localStorage.getItem('maintenance_mode') === 'true') {
      return true
    }
  } catch (e) {
    // localStorage bisa throw di private mode / disabled cookies
    console.warn('[Router] localStorage unavailable:', e)
  }

  return false
}

const routes = [
  { path: '/', name: 'Catalog', component: Catalog },
  { path: '/produk/:slug', name: 'ProductDetail', component: ProductDetail },
  { path: '/cart', name: 'Cart', component: Cart, meta: { noindex: true } },
  { path: '/checkout', name: 'Checkout', component: Checkout, meta: { noindex: true } },
  { path: '/checkout-success', name: 'CheckoutSuccess', component: CheckoutSuccess, meta: { noindex: true } },

  // Route Maintenance
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: Maintenance,
    meta: { noindex: true }
  },

  // Catch-all: redirect dinamis sesuai status maintenance
  {
    path: '/:pathMatch(.*)*',
    redirect: () => (isMaintenanceMode() ? '/maintenance' : '/')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// ============================================
// GUARD: Blokir semua route saat maintenance ON
// ============================================
router.beforeEach((to, from, next) => {
  const maintenance = isMaintenanceMode()

  // Maintenance ON + user mau akses selain /maintenance → paksa redirect
  if (maintenance && to.name !== 'Maintenance') {
    return next({ name: 'Maintenance', replace: true })
  }

  // Maintenance OFF + user masih di /maintenance → lempar ke katalog
  if (!maintenance && to.name === 'Maintenance') {
    return next({ name: 'Catalog', replace: true })
  }

  next()
})

// ============================================
// SEO: noindex untuk halaman privat
// ============================================
router.afterEach((to) => {
  if (to.meta.noindex) {
    const el = document.querySelector('meta[name="robots"]')
    if (el) el.setAttribute('content', 'noindex, nofollow')
    else {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    }
  } else {
    const el = document.querySelector('meta[name="robots"]')
    if (el) el.remove()
  }
})

export default router