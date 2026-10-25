<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold">Sinar Pagi Web - Test Phase 1</h1>
    <p>Produk: {{ products.length }}</p>
    <ul>
      <li v-for="p in products.slice(0,10)" :key="p.id">{{ p.name }} - {{ p.category }}</li>
    </ul>
    <p v-if="loading">Loading 498 produk dari sinarpagi-db...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { productService } from './services/productService.js'

const products = ref([])
const loading = ref(true)

onMounted(async () => {
  console.log('Test pull produk...')
  const result = await productService.syncPublishedProducts()
  products.value = result
  loading.value = false
  console.log('Produk dapet:', result.length, result)
})
</script>