<script setup lang="ts">
withDefaults(
  defineProps<{ name: string; alt: string; sizes?: string; eager?: boolean }>(),
  { sizes: '100vw', eager: false },
)
</script>

<template>
  <img
    :src="`/images/${name}-1920.webp`"
    :srcset="`/images/${name}-960.webp 960w, /images/${name}-1920.webp 1920w`"
    :sizes="sizes"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : undefined"
    decoding="async"
  >
</template>
