<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const toast = useToast()
const isNew = computed(() => route.params.id === 'nouvelle')

type Detail = AdminGallery & { media: AdminMedia[] }
const detail = ref<Detail | null>(null)
const loadError = ref('')

const form = reactive({
  name: '',
  eventDate: '',
  eventType: 'mariage' as AdminGallery['eventType'],
  validityDays: 60,
  publicDownload: false,
  pin: '',
  removePin: false,
  folder: '' as string | null,
})
const saving = ref(false)
const formError = ref('')
const pickingFolder = ref(false)

function fillForm(g: AdminGallery) {
  form.name = g.name
  form.eventDate = g.eventDate ?? ''
  form.eventType = g.eventType
  form.validityDays = g.validityDays
  form.publicDownload = g.publicDownload
  form.pin = ''
  form.removePin = false
  form.folder = g.folder
}

async function load() {
  if (isNew.value) return
  try {
    detail.value = await $fetch<Detail>(`/api/admin/galleries/${route.params.id}`)
    fillForm(detail.value)
    if (detail.value.job && ['scanning', 'processing'].includes(detail.value.job.state)) pollJob()
  } catch (err) {
    loadError.value = errorMessage(err, 'Galerie introuvable.')
  }
}
onMounted(load)

useHead(() => ({ title: `${isNew.value ? 'Nouvelle galerie' : detail.value?.name ?? 'Galerie'} — SoProd` }))

const origin = computed(() => (import.meta.client ? window.location.origin : ''))
const privateLink = computed(() => detail.value ? `${origin.value}/g/${detail.value.privateToken}` : '')
const publicLink = computed(() => detail.value ? `${origin.value}/g/${detail.value.publicToken}` : '')

async function save() {
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = 'Donnez un nom au projet, par exemple « Claire & Antoine ».'
    return
  }
  if (form.pin && !/^\d{4}$/.test(form.pin)) {
    formError.value = 'Le code PIN doit comporter exactement 4 chiffres.'
    return
  }
  saving.value = true
  const body = {
    name: form.name,
    eventDate: form.eventDate || null,
    eventType: form.eventType,
    validityDays: form.validityDays,
    publicDownload: form.publicDownload,
    folder: form.folder,
    pin: form.pin || undefined,
    removePin: form.removePin || undefined,
  }
  try {
    if (isNew.value) {
      const created = await $fetch<AdminGallery>('/api/admin/galleries', { method: 'POST', body })
      toast.show('Galerie créée')
      await navigateTo(`/admin/galerie/${created.id}`, { replace: true })
      await load()
    } else {
      const updated = await $fetch<AdminGallery>(`/api/admin/galleries/${detail.value!.id}`, { method: 'PATCH', body })
      detail.value = { ...detail.value!, ...updated }
      fillForm(updated)
      toast.show('Modifications enregistrées')
    }
  } catch (err) {
    formError.value = errorMessage(err, 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

async function chooseFolder(path: string) {
  form.folder = path
  pickingFolder.value = false
  if (!isNew.value && detail.value) {
    const updated = await $fetch<AdminGallery>(`/api/admin/galleries/${detail.value.id}`, { method: 'PATCH', body: { folder: path } })
    detail.value = { ...detail.value, ...updated }
    toast.show('Dossier enregistré')
  }
}

// Indexing
const job = computed(() => detail.value?.job ?? null)
const indexing = computed(() => job.value?.state === 'scanning' || job.value?.state === 'processing')
const progress = computed(() => (job.value?.total ? Math.round((job.value.done / job.value.total) * 100) : 0))
const forceIndex = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | undefined

async function startIndex() {
  if (!detail.value) return
  try {
    detail.value.job = await $fetch<IndexJob>(`/api/admin/galleries/${detail.value.id}/indexing`, { method: 'POST', body: { force: forceIndex.value } })
    pollJob()
  } catch (err) {
    toast.show(errorMessage(err, 'Indexation impossible.'), 4200)
  }
}

function pollJob() {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    if (!detail.value) return
    const state = await $fetch<IndexJob | null>(`/api/admin/galleries/${detail.value.id}/indexing`).catch(() => null)
    if (!detail.value) return
    detail.value.job = state
    if (state && ['scanning', 'processing'].includes(state.state)) pollJob()
    else {
      await load()
      toast.show(state?.state === 'error' ? 'L’indexation a échoué' : 'Indexation terminée')
    }
  }, 900)
}
onBeforeUnmount(() => clearTimeout(pollTimer))

// Favourites
const favorites = computed(() => detail.value?.media.filter(m => m.favorite) ?? [])
const lightroomLine = computed(() => favorites.value.map(m => m.filename.replace(/\.[^.]+$/, '')).join(', '))

async function copyLightroom() {
  await navigator.clipboard.writeText(lightroomLine.value)
  toast.show('Liste copiée pour Lightroom')
}

// Cover, cache, links, deletion
async function setCover(media: AdminMedia) {
  if (!detail.value || media.kind !== 'image') return
  await $fetch(`/api/admin/galleries/${detail.value.id}/cover`, { method: 'POST', body: { mediaId: media.id } })
  detail.value.coverMediaId = media.id
  toast.show('Couverture mise à jour')
}

async function purge() {
  if (!detail.value) return
  if (!confirm('Purger le cache des miniatures ? La galerie ne sera plus consultable jusqu’à la prochaine indexation. Les originaux sur la Box ne sont pas touchés.')) return
  const updated = await $fetch<AdminGallery>(`/api/admin/galleries/${detail.value.id}/purge`, { method: 'POST' })
  detail.value = { ...detail.value, ...updated }
  await load()
  toast.show('Cache purgé')
}

async function regenerateLinks() {
  if (!detail.value) return
  if (!confirm('Générer de nouveaux liens ? Les anciens liens cesseront immédiatement de fonctionner.')) return
  const updated = await $fetch<AdminGallery>(`/api/admin/galleries/${detail.value.id}`, { method: 'PATCH', body: { regenerateLinks: true } })
  detail.value = { ...detail.value, ...updated }
  toast.show('Nouveaux liens générés')
}

async function remove() {
  if (!detail.value) return
  if (!confirm(`Supprimer définitivement la galerie « ${detail.value.name} » ? Les favoris et le cache seront effacés. Les originaux sur la Box ne sont pas touchés.`)) return
  await $fetch(`/api/admin/galleries/${detail.value.id}`, { method: 'DELETE' })
  toast.show('Galerie supprimée')
  await navigateTo('/admin')
}

const eventTypes = [
  { id: 'mariage', label: 'Mariage' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'studio', label: 'Studio' },
] as const
</script>

<template>
  <div>
    <NuxtLink to="/admin" class="caps link-under inline-flex items-center gap-2 py-1 text-graphite">
      <SoIcon name="chevron-left" :size="14" />
      Galeries
    </NuxtLink>

    <p v-if="loadError" class="mt-10 bg-paper p-6" role="alert">{{ loadError }}</p>

    <template v-else-if="isNew || detail">
      <div class="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div class="min-w-0">
          <h1 class="display truncate text-[clamp(2.4rem,6vw,3.8rem)]">
            <template v-if="isNew">Nouvelle galerie</template>
            <GalleryNames v-else :name="detail!.name" />
          </h1>
          <p v-if="detail" class="mt-3 text-graphite">
            {{ detail.counts.images }} photo(s) · {{ detail.counts.videos }} film(s) · {{ detail.counts.favorites }} favori(s) ·
            <template v-if="isPermanentLink(detail.validityDays)">accès permanent</template>
            <template v-else>{{ detail.expired ? 'expirée depuis le' : 'en ligne jusqu’au' }} {{ formatDate(detail.expiresAt) }}</template>
          </p>
        </div>
        <div v-if="detail" class="flex flex-wrap gap-2">
          <a :href="privateLink" target="_blank" class="btn-line">
            <SoIcon name="eye" :size="16" />
            Voir comme les mariés
          </a>
        </div>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-12">
        <!-- Informations -->
        <section class="bg-paper p-6 sm:p-8 lg:col-span-7" aria-labelledby="infos">
          <h2 id="infos" class="display text-2xl">Informations</h2>
          <form class="mt-8 space-y-8" novalidate @submit.prevent="save">
            <div>
              <label for="name" class="field-label">Nom du projet</label>
              <input id="name" v-model="form.name" class="field mt-1" placeholder="Claire & Antoine" required>
            </div>
            <div class="grid gap-8 sm:grid-cols-2">
              <div>
                <label for="date" class="field-label">Date de l’événement</label>
                <input id="date" v-model="form.eventDate" type="date" class="field mt-1">
              </div>
              <fieldset>
                <legend class="field-label">Type d’événement</legend>
                <div class="mt-3 flex border border-line">
                  <label v-for="t in eventTypes" :key="t.id" class="caps flex-1 cursor-pointer py-3 text-center transition-colors has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-1">
                    <input v-model="form.eventType" type="radio" name="eventType" :value="t.id" class="sr-only">
                    {{ t.label }}
                  </label>
                </div>
              </fieldset>
            </div>
            <div class="grid gap-8 sm:grid-cols-2">
              <fieldset>
                <legend class="field-label">Validité du lien</legend>
                <div class="mt-3 grid grid-cols-2 border border-line sm:grid-cols-4">
                  <label
                    v-for="opt in ADMIN_VALIDITY_OPTIONS"
                    :key="opt.value"
                    class="caps cursor-pointer py-3 text-center transition-colors has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-1"
                  >
                    <input v-model.number="form.validityDays" type="radio" name="validity" :value="opt.value" class="sr-only">
                    {{ opt.label }}
                  </label>
                </div>
                <p v-if="detail && form.validityDays !== detail.validityDays" class="mt-2 text-sm text-graphite">
                  <template v-if="isPermanentLink(form.validityDays)">Le lien restera accessible sans date limite.</template>
                  <template v-else>La nouvelle échéance partira d’aujourd’hui.</template>
                </p>
              </fieldset>
              <div>
                <label for="pin" class="field-label">Code PIN des mariés</label>
                <input
                  id="pin"
                  v-model="form.pin"
                  inputmode="numeric"
                  maxlength="4"
                  autocomplete="off"
                  class="field mt-1"
                  :class="form.pin ? 'tracking-[0.5em]' : ''"
                  :placeholder="detail?.hasPin && !form.removePin ? '••••  (actif)' : '4 chiffres, facultatif'"
                  :disabled="form.removePin"
                >
                <label v-if="detail?.hasPin" class="mt-3 flex items-center gap-2 text-sm text-graphite">
                  <input v-model="form.removePin" type="checkbox" class="size-4 accent-ink">
                  Retirer le code PIN
                </label>
              </div>
            </div>
            <label class="flex cursor-pointer items-start gap-4 border-t border-line pt-6">
              <input v-model="form.publicDownload" type="checkbox" class="peer sr-only">
              <span class="mt-0.5 flex h-6 w-11 shrink-0 items-center border border-ink p-0.5 transition-colors peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 [&>span]:transition-[transform,background-color] peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-paper">
                <span class="size-[1.125rem] bg-ink" />
              </span>
              <span>
                <span class="block">Autoriser les invités à télécharger les originaux</span>
                <span class="mt-1 block text-sm text-graphite">Les mariés peuvent toujours télécharger en haute définition depuis leur lien privé.</span>
              </span>
            </label>

            <p v-if="formError" class="text-sm" role="alert">{{ formError }}</p>
            <button type="submit" class="btn-ink" :disabled="saving">
              {{ saving ? 'Enregistrement…' : isNew ? 'Créer la galerie' : 'Enregistrer' }}
            </button>
          </form>
        </section>

        <!-- Dossier & indexation -->
        <section class="bg-paper p-6 sm:p-8 lg:col-span-5" aria-labelledby="dossier">
          <h2 id="dossier" class="display text-2xl">Dossier sur la Box</h2>
          <p class="mt-2 text-sm text-graphite">Les originaux restent sur le disque. Seules des miniatures WebP légères sont stockées sur l’hébergement.</p>

          <div class="mt-6 flex items-center gap-3 border-y border-line py-4">
            <SoIcon name="folder" :size="20" class="text-graphite" />
            <p class="min-w-0 flex-1 truncate font-mono text-sm">{{ form.folder || 'Aucun dossier choisi' }}</p>
            <button v-if="!pickingFolder" class="caps link-under py-1" @click="pickingFolder = true">
              {{ form.folder ? 'Changer' : 'Choisir' }}
            </button>
          </div>
          <AdminFolderPicker v-if="pickingFolder" class="mt-4" :initial="form.folder" @select="chooseFolder" @cancel="pickingFolder = false" />

          <template v-if="detail">
            <div class="mt-8">
              <div v-if="indexing && job" aria-live="polite">
                <div class="flex items-baseline justify-between">
                  <p class="caps">{{ job.state === 'scanning' ? 'Lecture du dossier' : 'Génération des miniatures' }}</p>
                  <p class="tabular-nums text-graphite">{{ job.done }} / {{ job.total || '…' }}</p>
                </div>
                <div class="mt-3 h-px bg-line">
                  <div class="h-px bg-ink transition-[width] duration-700 ease-out-expo" :style="{ width: `${progress}%` }" />
                </div>
                <p class="mt-3 truncate text-sm text-graphite">{{ job.current }}</p>
              </div>
              <template v-else>
                <button class="btn-ink w-full" :disabled="!detail.folder" @click="startIndex">
                  <SoIcon name="refresh" :size="16" />
                  {{ detail.indexedAt ? 'Relancer l’indexation' : 'Indexer le dossier' }}
                </button>
                <label v-if="detail.indexedAt" class="mt-3 flex items-center gap-2 text-sm text-graphite">
                  <input v-model="forceIndex" type="checkbox" class="size-4 accent-ink">
                  Régénérer toutes les miniatures
                </label>
                <p v-if="detail.indexedAt" class="mt-3 text-sm text-graphite">Dernière indexation le {{ formatDate(detail.indexedAt, { dateStyle: 'long', timeStyle: 'short' }) }}.</p>
                <p v-if="detail.statusMessage" class="mt-2 text-sm">{{ detail.statusMessage }}</p>
                <ul v-if="job?.errors.length" class="mt-3 space-y-1 text-sm">
                  <li v-for="e in job.errors.slice(0, 5)" :key="e">{{ e }}</li>
                </ul>
              </template>
            </div>

            <div class="mt-8 flex items-center justify-between border-t border-line pt-6">
              <div>
                <p class="field-label">Cache des miniatures</p>
                <p class="mt-1 tabular-nums">{{ formatBytes(detail.cacheBytes) }}</p>
              </div>
              <button class="btn-line px-5 py-3" :disabled="!detail.cacheBytes || indexing" @click="purge">
                <SoIcon name="trash" :size="16" />
                Purger
              </button>
            </div>
          </template>
        </section>

        <template v-if="detail">
          <!-- Liens -->
          <section class="bg-paper p-6 sm:p-8 lg:col-span-7" aria-labelledby="liens">
            <h2 id="liens" class="display text-2xl">Liens de partage</h2>
            <div class="mt-8 space-y-8">
              <AdminCopyField
                label="Lien privé — les mariés"
                :value="privateLink"
                :hint="detail.hasPin ? 'Favoris et téléchargement HD. Protégé par le code PIN : envoyez-le séparément.' : 'Favoris et téléchargement HD.'"
              />
              <AdminCopyField
                label="Lien public — les invités"
                :value="publicLink"
                :hint="detail.publicDownload ? 'Définition réduite, téléchargement des originaux ouvert.' : 'Définition réduite, sans téléchargement.'"
              />
            </div>
            <button class="caps link-under mt-8 py-1 text-graphite" @click="regenerateLinks">Générer de nouveaux liens</button>
          </section>

          <!-- Sélection -->
          <section class="bg-paper p-6 sm:p-8 lg:col-span-5" aria-labelledby="selection">
            <h2 id="selection" class="display text-2xl">Sélection des mariés</h2>
            <p class="mt-2 text-sm text-graphite">
              {{ favorites.length ? `${favorites.length} image(s) marquée(s) d’un cœur.` : 'Aucun favori pour l’instant.' }}
            </p>
            <template v-if="favorites.length">
              <p class="mt-6 max-h-28 overflow-y-auto border-y border-line py-3 font-mono text-sm leading-relaxed">{{ lightroomLine }}</p>
              <div class="mt-6 flex flex-col gap-2 sm:flex-row">
                <a :href="`/api/admin/galleries/${detail.id}/export`" class="btn-ink flex-1" download>
                  <SoIcon name="download" :size="16" />
                  Exporter .txt
                </a>
                <button class="btn-line flex-1" @click="copyLightroom">
                  <SoIcon name="copy" :size="16" />
                  Copier
                </button>
              </div>
              <p class="mt-4 text-sm text-graphite">Dans Lightroom : Bibliothèque › Filtre texte › Nom de fichier › Contient, puis collez la liste.</p>
            </template>
          </section>

          <!-- Médias -->
          <section class="bg-paper p-6 sm:p-8 lg:col-span-12" aria-labelledby="medias">
            <div class="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="medias" class="display text-2xl">Images</h2>
              <p class="text-sm text-graphite">Cliquez sur une photo pour en faire la couverture.</p>
            </div>
            <p v-if="!detail.media.length" class="mt-6 text-graphite">Aucune image indexée. Choisissez un dossier puis lancez l’indexation.</p>
            <ul v-else class="mt-6 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-8">
              <li v-for="m in detail.media" :key="m.id" class="relative">
                <button
                  class="group relative block aspect-square w-full overflow-hidden bg-mist"
                  :style="{ backgroundColor: m.tone ?? undefined }"
                  :aria-label="m.kind === 'image' ? `Définir ${m.filename} comme couverture` : m.filename"
                  :aria-pressed="detail.coverMediaId === m.id"
                  @click="setCover(m)"
                >
                  <img
                    v-if="m.kind === 'image' && m.cached"
                    :src="mediaUrl(detail.privateToken, m.id, 'thumb')"
                    :alt="m.filename"
                    loading="lazy"
                    class="size-full object-cover transition-opacity group-hover:opacity-80"
                  >
                  <span v-else class="grid size-full place-items-center text-paper"><SoIcon :name="m.kind === 'video' ? 'film' : 'image'" :size="22" /></span>
                  <span v-if="detail.coverMediaId === m.id" class="caps absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-paper">Couverture</span>
                  <span v-if="m.favorite" class="absolute right-1 top-1 text-paper drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]"><SoIcon name="heart" :size="16" filled /></span>
                </button>
              </li>
            </ul>
          </section>

          <div class="flex justify-end lg:col-span-12">
            <button class="caps link-under inline-flex items-center gap-2 py-1 text-graphite" @click="remove">
              <SoIcon name="trash" :size="14" />
              Supprimer la galerie
            </button>
          </div>
        </template>
      </div>
    </template>

    <div v-else class="mt-10 h-96 animate-pulse bg-paper" aria-hidden="true" />
  </div>
</template>
