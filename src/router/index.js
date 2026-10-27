import { createRouter, createWebHistory } from 'vue-router'
import Catalog from '../views/Catalog.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import CheckoutSuccess from '../views/CheckoutSuccess.vue'

const routes = [
  { path: '/', name: 'Catalog', component: Catalog },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/checkout', name: 'Checkout', component: Checkout },
  { path: '/checkout-success', name: 'CheckoutSuccess', component: CheckoutSuccess }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
