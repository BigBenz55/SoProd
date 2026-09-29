<script setup lang="ts">
const props = defineProps<{ name: string }>()
const names = computed(() => splitNames(props.name))
</script>

<template>
  <template v-if="names">{{ names.first }} <em class="font-normal">&amp;</em> {{ names.second }}</template>
  <template v-else>{{ name }}</template>
</template>
