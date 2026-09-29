<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const token = computed(() => String(route.params.token))
const toast = useToast()

const { data, error, refresh } = await useFetch<GalleryPayload>(() => `/api/g/${token.value}`, {
  key: `gallery-${token.value}`,
})

const gallery = computed(() => data.value?.gallery)
const media = ref<GalleryItem[]>([])
watch(() => data.value?.media, (m) => { media.value = m ? [...m] : [] }, { immediate: true })

type Filter = 'all' | 'photos' | 'films' | 'favorites'
const filter = ref<Filter>('all')
const counts = computed(() => ({
  all: media.value.length,
  photos: media.value.filter(m => m.kind === 'image').length,
  films: media.value.filter(m => m.kind === 'video').length,
  favorites: media.value.filter(m => m.favorite).length,
}))
const visible = computed(() => {
  switch (filter.value) {
    case 'photos': return media.value.filter(m => m.kind === 'image')
    case 'films': return media.value.filter(m => m.kind === 'video')
    case 'favorites': return media.value.filter(m => m.favorite)
    default: return media.value
  }
})
const filters = computed(() => {
  const list: { id: Filter; label: string; count: number }[] = [{ id: 'all', label: 'Tout', count: counts.value.all }]
  if (counts.value.films && counts.value.photos) {
    list.push({ id: 'photos', label: 'Photos', count: counts.value.photos })
    list.push({ id: 'films', label: 'Films', count: counts.value.films })
  }
  if (gallery.value?.canFavorite) list.push({ id: 'favorites', label: 'Favoris', count: counts.value.favorites })
  return list
})

const lightboxIndex = ref<number | null>(null)
const coverUrl = computed(() => {
  const id = gallery.value?.coverId
  if (!id) return null
  return mediaUrl(token.value, id, data.value?.role === 'client' ? 'large' : 'public')
})

async function toggleFavorite(item: GalleryItem) {
  const next = !item.favorite
  item.favorite = next
  try {
    await $fetch(`/api/g/${token.value}/favorites/${item.id}`, { method: 'PUT', body: { favorite: next } })
    toast.show(next ? 'Ajoutée à vos favoris' : 'Retirée de vos favoris', 1600)
  } catch (err) {
    item.favorite = !next
    toast.show(errorMessage(err, 'Le favori n’a pas pu être enregistré. Réessayez.'))
  }
}

async function download(item: GalleryItem) {
  try {
    const { online } = await $fetch<{ online: boolean }>(`/api/g/${token.value}/status`)
    if (!online) {
      toast.show('Les originaux sont momentanément hors ligne. Réessayez un peu plus tard.', 4200)
      return
    }
  } catch {
    // If the check itself fails, let the browser attempt the download.
  }
  const a = document.createElement('a')
  a.href = mediaUrl(token.value, item.id, 'download')
  a.download = item.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  toast.show('Téléchargement lancé')
}

function scrollToGrid() {
  document.getElementById('photos')?.scrollIntoView({ behavior: 'smooth' })
}

useHead(() => ({
  title: gallery.value ? `${gallery.value.name} — SoProd` : 'Galerie — SoProd',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}))
</script>

<template>
  <GalleryNotice v-if="error?.statusCode === 404 || (!data && error)" title="Galerie introuvable">
    <p>Ce lien ne correspond à aucune galerie. Vérifiez qu’il a été copié en entier depuis votre message, ou demandez-en un nouveau à SoProd.</p>
  </GalleryNotice>

  <GalleryNotice v-else-if="data?.state === 'expired'" title="Cette galerie est arrivée à échéance" :name="gallery?.name">
    <p>
      Elle était disponible jusqu’au {{ formatDate(gallery?.expiresAt) }}. Vos images sont toujours conservées :
      écrivez à SoProd pour rouvrir l’accès.
    </p>
  </GalleryNotice>

  <GalleryPinGate
    v-else-if="data?.state === 'locked' && gallery"
    :token="token"
    :name="gallery.name"
    :event-date="gallery.eventDate"
    @unlocked="refresh()"
  />

  <div v-else-if="data?.state === 'open' && gallery" class="bg-paper text-ink">
    <!-- Couverture de l’album -->
    <header class="relative h-svh min-h-[36rem] overflow-hidden bg-ink">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        alt=""
        fetchpriority="high"
        class="photo-settle absolute inset-0 size-full object-cover"
      >
      <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.35),transparent_35%,transparent_60%,rgb(0_0_0/0.55))]" />

      <div class="absolute inset-x-0 top-0 flex h-18 items-center justify-between px-5 text-paper sm:px-8">
        <NuxtLink to="/" class="text-[1.7rem]" aria-label="SoProd"><SoWordmark /></NuxtLink>
        <p v-if="data.role === 'guest'" class="caps text-paper/80">Galerie invités</p>
      </div>

      <div class="relative flex h-full items-center justify-center px-5">
        <div class="vellum vellum-lift w-full max-w-[38rem] px-7 py-12 text-center sm:px-14 sm:py-16">
          <h1 class="display enter text-[clamp(2.8rem,9vw,5.2rem)] [animation-delay:100ms]">
            <GalleryNames :name="gallery.name" />
          </h1>
          <div class="rule-double mx-auto mt-6 w-16" />
          <p class="enter mt-6 text-graphite [animation-delay:200ms]">
            {{ EVENT_LABELS[gallery.eventType] }}<template v-if="gallery.eventDate"> · {{ formatDate(gallery.eventDate) }}</template>
          </p>
          <button class="btn-ink enter mt-9 [animation-delay:300ms]" @click="scrollToGrid">
            Ouvrir la galerie
            <SoIcon name="chevron-down" :size="16" />
          </button>
        </div>
      </div>
      <p v-if="gallery.isDemo" class="caps absolute bottom-5 right-5 text-paper/70">Galerie de démonstration</p>
    </header>

    <!-- Barre de la galerie -->
    <nav id="photos" class="sticky top-0 z-40 scroll-mt-0 bg-paper/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur" aria-label="Filtres de la galerie">
      <div class="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-3 py-2 sm:px-6">
        <p class="display hidden truncate text-xl md:block"><GalleryNames :name="gallery.name" /></p>
        <div class="-mx-1 flex overflow-x-auto" role="tablist">
          <button
            v-for="f in filters"
            :key="f.id"
            role="tab"
            :aria-selected="filter === f.id"
            class="caps flex h-12 shrink-0 items-center gap-2 px-3 transition-colors"
            :class="filter === f.id ? 'text-ink' : 'text-graphite hover:text-ink'"
            @click="filter = f.id"
          >
            <SoIcon v-if="f.id === 'favorites'" name="heart" :size="14" :filled="filter === 'favorites'" />
            <span class="link-under py-1" :aria-current="filter === f.id ? 'page' : undefined">{{ f.label }}</span>
            <span class="tabular-nums text-graphite">{{ f.count }}</span>
          </button>
        </div>
        <p class="caps hidden text-graphite sm:block">
          <template v-if="gallery.canDownload">Téléchargement HD ouvert</template>
          <template v-else>Consultation seule</template>
          <span class="mx-2 text-line-strong">·</span>
          <template v-if="isPermanentLink(gallery.validityDays)">accès permanent</template>
          <template v-else>jusqu’au {{ formatDate(gallery.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' }) }}</template>
        </p>
      </div>
    </nav>

    <main class="mx-auto max-w-[120rem] px-1.5 pb-24 pt-1.5 sm:px-2 sm:pt-2">
      <p v-if="data.role === 'guest'" class="mx-auto max-w-[40rem] px-4 py-10 text-center text-graphite">
        Vous consultez la galerie partagée par les mariés. Les images sont affichées en définition réduite{{ gallery.canDownload ? ' ; les originaux restent téléchargeables depuis la visionneuse.' : '.' }}
      </p>

      <ClientOnly>
        <GalleryMasonryGrid
          v-if="visible.length"
          :items="visible"
          :token="token"
          :can-favorite="Boolean(gallery.canFavorite)"
          @open="lightboxIndex = $event"
          @toggle="toggleFavorite"
        />
        <template #fallback>
          <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4" aria-hidden="true">
            <div v-for="i in 8" :key="i" class="aspect-[4/5] animate-pulse bg-mist" />
          </div>
        </template>
      </ClientOnly>

      <div v-if="!visible.length" class="mx-auto max-w-[30rem] px-6 py-28 text-center">
        <template v-if="filter === 'favorites'">
          <SoIcon name="heart" :size="28" class="mx-auto" />
          <h2 class="display mt-6 text-4xl">Aucun favori pour l’instant</h2>
          <p class="mt-4 text-graphite">Touchez le cœur d’une photo pour la garder de côté. Votre sélection nous parviendra telle quelle.</p>
          <button class="btn-line mt-8" @click="filter = 'all'">Voir toutes les images</button>
        </template>
        <template v-else>
          <h2 class="display text-4xl">Vos images arrivent</h2>
          <p class="mt-4 text-graphite">La galerie est prête, les images sont en cours de préparation. Revenez d’ici quelques heures.</p>
        </template>
      </div>
    </main>

    <footer class="border-t border-line px-5 py-12 text-center">
      <SoMonogram :size="40" class="mx-auto" />
      <p class="caps mt-5 text-graphite">Galerie {{ data.role === 'client' ? 'privée' : 'invités' }} — SoProd</p>
    </footer>

    <GalleryLightbox
      v-model:index="lightboxIndex"
      :items="visible"
      :token="token"
      :role="data.role"
      :can-download="Boolean(gallery.canDownload)"
      :can-favorite="Boolean(gallery.canFavorite)"
      @toggle="toggleFavorite"
      @download="download"
    />
  </div>
</template>
