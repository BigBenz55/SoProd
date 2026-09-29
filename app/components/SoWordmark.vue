<script setup lang="ts">
defineProps<{ tag?: string }>()
</script>

<template>
  <component :is="tag ?? 'span'" class="display inline-block whitespace-nowrap" aria-label="SoProd">
    <span class="italic" aria-hidden="true">So</span><span aria-hidden="true">Prod</span>
  </component>
</template>
