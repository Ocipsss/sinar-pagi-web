import { createRouter, createWebHistory } from 'vue-router'
import Catalog from '../views/Catalog.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import CheckoutSuccess from '../views/CheckoutSuccess.vue'
import ProductDetail from '../views/ProductDetail.vue'

const routes = [
  { path: '/', name: 'Catalog', component: Catalog },
  { path: '/produk/:slug', name: 'ProductDetail', component: ProductDetail },
  { path: '/cart', name: 'Cart', component: Cart, meta: { noindex: true } },
  { path: '/checkout', name: 'Checkout', component: Checkout, meta: { noindex: true } },
  { path: '/checkout-success', name: 'CheckoutSuccess', component: CheckoutSuccess, meta: { noindex: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

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