<script setup>
import { X } from 'lucide-vue-next'
defineProps({
  isOpen: Boolean,
  title: String
})
defineEmits(['close'])
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
    <div class="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="font-bold text-gray-800 text-lg">{{ title }}</h3>
        <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
          <X :size="20" />
        </button>
      </div>
      <!-- Body -->
      <div class="p-4 overflow-y-auto flex-1">
        <slot />
      </div>
    </div>
  </div>
</template>
