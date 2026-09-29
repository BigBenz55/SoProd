<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <div class="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
    <TransitionGroup
      enter-from-class="opacity-0 translate-y-3"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-500 ease-out-expo"
      leave-active-class="transition duration-300"
    >
      <p v-for="t in toasts" :key="t.id" class="caps bg-ink px-5 py-3 text-paper shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)]">
        {{ t.message }}
      </p>
    </TransitionGroup>
  </div>
</template>
