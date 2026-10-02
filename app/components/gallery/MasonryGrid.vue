<script setup lang="ts">
const props = defineProps<{
  items: GalleryItem[]
  token: string
  canFavorite: boolean
}>()
const emit = defineEmits<{ open: [index: number]; toggle: [item: GalleryItem] }>()

const root = ref<HTMLElement | null>(null)
const columnCount = ref(3)
const loaded = reactive(new Set<number>())

function measure(width: number) {
  columnCount.value = width < 560 ? 2 : width < 1000 ? 3 : width < 1600 ? 4 : 5
}

let observer: ResizeObserver | null = null
onMounted(() => {
  if (!root.value) return
  measure(root.value.clientWidth)
  observer = new ResizeObserver(([entry]) => measure(entry!.contentRect.width))
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** Shortest-column packing keeps the reading order close to left-to-right, top-to-bottom. */
const columns = computed(() => {
  const cols = Array.from({ length: columnCount.value }, () => ({ height: 0, items: [] as { item: GalleryItem; index: number }[] }))
  props.items.forEach((item, index) => {
    const ratio = item.height / item.width
    const target = cols.reduce((min, c) => (c.height < min.height ? c : min), cols[0]!)
    target.items.push({ item, index })
    target.height += ratio
  })
  return cols
})

function src(item: GalleryItem) {
  if (item.kind === 'video') return item.hasPoster ? mediaUrl(props.token, item.id, 'poster') : null
  return mediaUrl(props.token, item.id, 'thumb')
}
</script>

<template>
  <div ref="root" class="flex gap-1.5 sm:gap-2">
    <div v-for="(col, c) in columns" :key="c" class="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
      <figure
        v-for="{ item, index } in col.items"
        :key="item.id"
        class="group relative overflow-hidden"
        :style="{ aspectRatio: `${item.width} / ${item.height}`, backgroundColor: item.tone ?? '#e9e9e8' }"
      >
        <button
          class="block size-full cursor-zoom-in focus-visible:outline-offset-[-4px] focus-visible:outline-paper"
          :aria-label="`${item.kind === 'video' ? 'Lire le film' : 'Agrandir la photo'} ${item.filename}`"
          @click="emit('open', index)"
        >
          <img
            v-if="src(item)"
            :src="src(item)!"
            :alt="item.filename"
            loading="lazy"
            decoding="async"
            class="size-full object-cover transition-[opacity,transform] duration-500 ease-out-expo group-hover:scale-[1.025]"
            :class="loaded.has(item.id) ? 'opacity-100' : 'opacity-0'"
            @load="loaded.add(item.id)"
          >
          <span v-if="item.kind === 'video'" class="absolute inset-0 grid place-items-center bg-ink/25 text-paper">
            <span class="grid size-16 place-items-center rounded-full border border-paper/70 backdrop-blur-sm">
              <SoIcon name="play" :size="22" filled />
            </span>
          </span>
        </button>

        <button
          v-if="canFavorite"
          class="absolute bottom-1 right-1 grid size-11 place-items-center text-paper drop-shadow-[0_1px_5px_rgb(0_0_0/0.55)] transition-[opacity,transform] duration-300 ease-out-expo active:scale-90 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
          :class="item.favorite ? '!opacity-100' : ''"
          :aria-pressed="Boolean(item.favorite)"
          :aria-label="item.favorite ? `Retirer ${item.filename} des favoris` : `Ajouter ${item.filename} aux favoris`"
          @click="emit('toggle', item)"
        >
          <SoIcon name="heart" :size="22" :filled="item.favorite" />
        </button>
      </figure>
    </div>
  </div>
</template>
