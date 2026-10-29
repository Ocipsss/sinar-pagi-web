<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary, secondary, outline, danger
  size: { type: String, default: 'md' }, // sm, md, lg
  disabled: Boolean
})
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/50',
      {
        'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md': variant === 'primary',
        'bg-gray-100 text-gray-800 hover:bg-gray-200': variant === 'secondary',
        'border border-gray-300 text-gray-700 hover:bg-gray-50': variant === 'outline',
        'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md': variant === 'danger',
        'px-3 py-1.5 text-xs sm:text-sm': size === 'sm',
        'px-4 py-2.5 text-sm sm:text-base': size === 'md',
        'px-6 py-3 text-base sm:text-lg': size === 'lg'
      }
    ]"
  >
    <slot />
  </button>
</template>
