<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  isOpen: Boolean,
  title: String
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      @click.self="$emit('close')"
    >
      <!-- CONTAINER MODAL (BOTTOM SHEET DI MOBILE, POPUP CARD DI TABLET/DESKTOP) -->
      <div 
        class="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- HEADER MODAL -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 class="font-bold text-gray-800 text-base sm:text-lg tracking-tight">{{ title }}</h3>
          <button 
            @click="$emit('close')" 
            class="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer active:scale-95"
            title="Tutup Modal"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- BODY MODAL -->
        <div class="p-5 overflow-y-auto flex-1">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
