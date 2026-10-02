<script setup lang="ts">
const props = defineProps<{ initial?: string | null }>()
const emit = defineEmits<{ select: [path: string]; cancel: [] }>()

interface Listing {
  path: string
  dirs: { name: string; path: string }[]
  fileCount: number
  mediaCount: number
}

const path = ref(props.initial || '/')
const listing = ref<Listing | null>(null)
const loading = ref(false)
const error = ref('')

async function load(target: string) {
  loading.value = true
  error.value = ''
  try {
    listing.value = await $fetch<Listing>('/api/admin/storage/browse', { query: { path: target } })
    path.value = listing.value.path
  } catch (err) {
    error.value = errorMessage(err, 'Impossible de lire ce dossier.')
    if (target !== '/' && !listing.value) await load('/')
  } finally {
    loading.value = false
  }
}
onMounted(() => load(path.value))

const crumbs = computed(() => {
  const parts = path.value.split('/').filter(Boolean)
  return [{ name: 'Racine', path: '/' }, ...parts.map((name, i) => ({ name, path: '/' + parts.slice(0, i + 1).join('/') }))]
})

const parentPath = computed(() => {
  const parts = path.value.split('/').filter(Boolean)
  if (!parts.length) return null
  parts.pop()
  return parts.length ? `/${parts.join('/')}` : '/'
})
</script>

<template>
  <div class="border border-line bg-paper">
    <div class="flex flex-wrap items-center gap-1 border-b border-line px-4 py-3 text-sm">
      <SoIcon name="box" :size="16" class="mr-1 text-graphite" />
      <template v-for="(c, i) in crumbs" :key="c.path">
        <span v-if="i" class="text-graphite">/</span>
        <button class="link-under py-0.5" :class="i === crumbs.length - 1 ? 'font-medium' : 'text-graphite'" @click="load(c.path)">{{ c.name }}</button>
      </template>
    </div>

    <p v-if="error" class="px-4 py-4 text-sm" role="alert">{{ error }}</p>

    <ul class="max-h-72 overflow-y-auto" :class="loading ? 'opacity-50' : ''" :aria-busy="loading">
      <li v-if="parentPath">
        <button class="flex w-full items-center gap-3 px-4 py-3 text-left text-graphite transition-colors hover:bg-mist" @click="load(parentPath)">
          <SoIcon name="chevron-left" :size="18" />
          <span class="flex-1">Dossier parent</span>
        </button>
      </li>
      <li v-for="d in listing?.dirs" :key="d.path">
        <button class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-mist" @click="load(d.path)">
          <SoIcon name="folder" :size="18" class="text-graphite" />
          <span class="flex-1 truncate">{{ d.name }}</span>
          <SoIcon name="chevron-right" :size="16" class="text-graphite" />
        </button>
      </li>
      <li v-if="listing && !listing.dirs.length" class="px-4 py-4 text-sm text-graphite">Aucun sous-dossier.</li>
    </ul>

    <div class="flex flex-col gap-3 border-t border-line px-4 py-4">
      <p class="text-sm text-graphite">
        <template v-if="listing">{{ listing.mediaCount }} photo(s) ou film(s) dans ce dossier</template>
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <button class="btn-line whitespace-nowrap px-5 py-3" @click="emit('cancel')">Annuler</button>
        <button class="btn-ink whitespace-nowrap px-5 py-3" :disabled="!listing || loading" @click="emit('select', path)">
          Choisir ce dossier
        </button>
      </div>
    </div>
  </div>
</template>
