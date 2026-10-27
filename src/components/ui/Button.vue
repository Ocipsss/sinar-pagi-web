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
      'inline-flex items-center justify-center font-medium transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl',
      {
        'bg-blue-600 text-white hover:bg-blue-700 shadow-sm': variant === 'primary',
        'bg-gray-100 text-gray-800 hover:bg-gray-200': variant === 'secondary',
        'border border-gray-300 text-gray-700 hover:bg-gray-50': variant === 'outline',
        'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2.5 text-base': size === 'md',
        'px-6 py-3 text-lg': size === 'lg'
      }
    ]"
  >
    <slot />
  </button>
</template>
