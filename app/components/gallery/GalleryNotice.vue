<script setup lang="ts">
defineProps<{ title: string; name?: string }>()
</script>

<template>
  <main class="grid min-h-svh place-items-center bg-paper px-6 py-20 text-center text-ink">
    <div class="w-full max-w-[34rem]">
      <SoMonogram :size="64" class="mx-auto" />
      <h1 class="display mt-10 text-[clamp(2.4rem,7vw,3.6rem)]">{{ title }}</h1>
      <div class="rule-double mx-auto mt-6 w-16" />
      <p v-if="name" class="mt-5 text-graphite"><GalleryNames :name="name" /></p>
      <div class="mx-auto mt-8 max-w-[28rem] text-graphite">
        <slot />
      </div>
      <div class="mt-10">
        <slot name="actions">
          <NuxtLink to="/" class="btn-line">SoProd</NuxtLink>
        </slot>
      </div>
    </div>
  </main>
</template>
