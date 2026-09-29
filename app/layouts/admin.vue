<script setup lang="ts">
const { data: storage, refresh } = useFetch('/api/admin/storage/status', { server: false })
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(refresh, 60_000) })
onBeforeUnmount(() => clearInterval(timer))

const driverLabel = computed(() => ({ local: 'Disque local', ftp: 'Box (FTP)', sftp: 'Box (SFTP)' })[storage.value?.driver ?? 'local'])
</script>

<template>
  <div class="min-h-svh bg-mist text-ink">
    <header class="sticky top-0 z-40 bg-ink text-paper">
      <div class="mx-auto flex h-16 max-w-[80rem] items-center justify-between gap-4 px-4 sm:px-8">
        <div class="flex items-center gap-6">
          <NuxtLink to="/admin" class="text-[1.6rem]" aria-label="Tableau de bord"><SoWordmark /></NuxtLink>
          <NuxtLink to="/admin" class="caps link-under hidden py-1 sm:block">Galeries</NuxtLink>
        </div>
        <div class="flex items-center gap-2 sm:gap-5">
          <p v-if="storage" class="caps flex items-center gap-2 text-silver" :title="`${driverLabel} — ${storage.latencyMs} ms`">
            <span class="size-2 rounded-full" :class="storage.online ? 'bg-paper' : 'border border-silver'" />
            <span class="hidden sm:inline">{{ driverLabel }}</span>
            {{ storage.online ? 'en ligne' : 'hors ligne' }}
          </p>
          <NuxtLink to="/" target="_blank" class="grid size-10 place-items-center text-silver hover:text-paper" aria-label="Voir le site" title="Voir le site">
            <SoIcon name="external" :size="18" />
          </NuxtLink>
          <button class="grid size-10 place-items-center text-silver hover:text-paper" aria-label="Se déconnecter" title="Se déconnecter" @click="adminLogout">
            <SoIcon name="logout" :size="18" />
          </button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-[80rem] px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <slot />
    </main>
  </div>
</template>
