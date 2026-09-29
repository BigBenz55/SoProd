<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Galeries — SoProd' })

const { data: galleries, pending, error } = await useFetch<AdminGallery[]>('/api/admin/galleries', { server: false })

const totals = computed(() => {
  const list = galleries.value ?? []
  return {
    count: list.length,
    active: list.filter(g => !g.expired).length,
    favorites: list.reduce((s, g) => s + g.counts.favorites, 0),
    cache: list.reduce((s, g) => s + g.cacheBytes, 0),
  }
})

function statusLabel(g: AdminGallery) {
  if (g.job && (g.job.state === 'scanning' || g.job.state === 'processing')) return `Indexation ${g.job.done}/${g.job.total || '…'}`
  if (g.expired) return 'Expirée'
  if (g.status === 'error') return 'Erreur'
  if (g.status === 'draft') return g.folder ? 'À indexer' : 'Brouillon'
  return 'En ligne'
}
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        <h1 class="display text-[clamp(2.6rem,6vw,3.8rem)]">Galeries</h1>
        <p v-if="galleries" class="mt-3 text-graphite">
          {{ totals.active }} en ligne sur {{ totals.count }} · {{ totals.favorites }} favori{{ totals.favorites > 1 ? 's' : '' }} reçu{{ totals.favorites > 1 ? 's' : '' }} · {{ formatBytes(totals.cache) }} de cache
        </p>
      </div>
      <NuxtLink to="/admin/galerie/nouvelle" class="btn-ink">
        <SoIcon name="plus" :size="16" />
        Nouvelle galerie
      </NuxtLink>
    </div>

    <p v-if="error" class="mt-10 bg-paper p-6" role="alert">{{ errorMessage(error, 'Impossible de charger les galeries.') }}</p>

    <div v-else-if="pending" class="mt-10 space-y-2" aria-hidden="true">
      <div v-for="i in 3" :key="i" class="h-28 animate-pulse bg-paper" />
    </div>

    <div v-else-if="!galleries?.length" class="mt-10 bg-paper px-6 py-20 text-center">
      <SoMonogram :size="56" class="mx-auto" />
      <h2 class="display mt-8 text-3xl">Aucune galerie pour l’instant</h2>
      <p class="mx-auto mt-3 max-w-[28rem] text-graphite">Créez une galerie, choisissez son dossier sur le disque de la Box, puis lancez l’indexation : les miniatures sont générées ici, les originaux restent chez vous.</p>
      <NuxtLink to="/admin/galerie/nouvelle" class="btn-ink mt-8">Créer la première galerie</NuxtLink>
    </div>

    <ul v-else class="mt-10 divide-y divide-line bg-paper">
      <li v-for="g in galleries" :key="g.id">
        <NuxtLink :to="`/admin/galerie/${g.id}`" class="group grid grid-cols-[4.5rem_1fr] items-center gap-4 p-4 transition-colors hover:bg-mist/60 sm:grid-cols-[6rem_1fr_auto] sm:gap-6 sm:p-5">
          <div class="aspect-[4/5] overflow-hidden bg-mist">
            <img
              v-if="g.coverMediaId"
              :src="mediaUrl(g.privateToken, g.coverMediaId, 'thumb')"
              alt=""
              loading="lazy"
              class="size-full object-cover"
            >
          </div>
          <div class="min-w-0">
            <p class="flex items-baseline gap-3">
              <span class="display truncate text-[1.7rem] leading-tight"><GalleryNames :name="g.name" /></span>
              <span v-if="g.isDemo" class="caps shrink-0 border border-line-strong px-2 py-0.5 text-graphite">Démo</span>
            </p>
            <p class="mt-1 text-sm text-graphite">
              {{ EVENT_LABELS[g.eventType] }}<template v-if="g.eventDate"> · {{ formatDate(g.eventDate) }}</template>
              · {{ g.counts.images }} photo{{ g.counts.images > 1 ? 's' : '' }}<template v-if="g.counts.videos"> · {{ g.counts.videos }} film{{ g.counts.videos > 1 ? 's' : '' }}</template>
            </p>
            <p class="caps mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-graphite sm:hidden">
              <span>{{ statusLabel(g) }}</span>
              <span class="flex items-center gap-1.5"><SoIcon name="heart" :size="12" filled /> {{ g.counts.favorites }}</span>
            </p>
          </div>
          <div class="hidden items-center gap-8 text-right sm:flex">
            <p class="flex items-center gap-2 tabular-nums" :title="`${g.counts.favorites} favoris`">
              <SoIcon name="heart" :size="16" :filled="g.counts.favorites > 0" />
              {{ g.counts.favorites }}
            </p>
            <div class="w-40">
              <p class="caps" :class="g.expired || g.status === 'error' ? 'text-ink' : 'text-graphite'">{{ statusLabel(g) }}</p>
              <p class="mt-1 text-sm text-graphite">
                <template v-if="isPermanentLink(g.validityDays)">sans expiration</template>
                <template v-else>{{ g.expired ? 'depuis le' : 'jusqu’au' }} {{ formatDate(g.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' }) }}</template>
              </p>
            </div>
            <SoIcon name="chevron-right" :size="20" class="text-graphite transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
