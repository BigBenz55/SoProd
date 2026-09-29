<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 88 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" aria-hidden="true" class="shrink-0">
    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="0.6" />
    <circle cx="50" cy="50" r="44.5" fill="none" stroke="currentColor" stroke-width="0.35" />
    <text
      x="50"
      y="61"
      text-anchor="middle"
      font-family="'Bodoni Moda Variable', Didot, serif"
      font-size="34"
      fill="currentColor"
      letter-spacing="-1"
    ><tspan font-style="italic">S</tspan><tspan dx="-3">P</tspan></text>
    <path d="M35 74h30" stroke="currentColor" stroke-width="0.5" />
    <circle cx="50" cy="74" r="1.1" fill="currentColor" />
  </svg>
</template>
