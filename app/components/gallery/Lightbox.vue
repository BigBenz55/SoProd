<script setup lang="ts">
const props = defineProps<{
  items: GalleryItem[]
  token: string
  role: 'client' | 'guest'
  canDownload: boolean
  canFavorite: boolean
}>()
const index = defineModel<number | null>('index', { required: true })
const emit = defineEmits<{ toggle: [item: GalleryItem]; download: [item: GalleryItem] }>()

const current = computed(() => (index.value === null ? null : props.items[index.value] ?? null))
const variant = computed(() => (props.role === 'client' ? 'large' : 'public'))

const closeButton = ref<HTMLButtonElement | null>(null)
const stage = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null
let pushedHistory = false

// Zoom & pan
const zoom = reactive({ scale: 1, x: 0, y: 0 })
const dragging = ref(false)
const imageLoaded = ref(false)
const swipeX = ref(0)

function resetZoom() {
  zoom.scale = 1
  zoom.x = 0
  zoom.y = 0
}

function clampPan() {
  const el = stage.value
  if (!el) return
  const maxX = (el.clientWidth * (zoom.scale - 1)) / 2
  const maxY = (el.clientHeight * (zoom.scale - 1)) / 2
  zoom.x = Math.max(-maxX, Math.min(maxX, zoom.x))
  zoom.y = Math.max(-maxY, Math.min(maxY, zoom.y))
}

function zoomAt(clientX: number, clientY: number, scale: number) {
  const el = stage.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cx = clientX - rect.left - rect.width / 2
  const cy = clientY - rect.top - rect.height / 2
  const next = Math.max(1, Math.min(4, scale))
  const k = next / zoom.scale
  zoom.x = cx - (cx - zoom.x) * k
  zoom.y = cy - (cy - zoom.y) * k
  zoom.scale = next
  if (next === 1) resetZoom()
  clampPan()
}

function toggleZoom(e: MouseEvent | PointerEvent) {
  if (current.value?.kind !== 'image') return
  if (zoom.scale > 1) resetZoom()
  else zoomAt(e.clientX, e.clientY, 2.4)
}

function go(delta: number) {
  if (index.value === null || !props.items.length) return
  index.value = (index.value + delta + props.items.length) % props.items.length
}

function close() {
  if (pushedHistory) {
    pushedHistory = false
    history.back()
  }
  index.value = null
}

// Pointer gestures: swipe to navigate, drag to pan, pinch to zoom, double-tap to zoom.
const pointers = new Map<number, { x: number; y: number }>()
let start = { x: 0, y: 0, panX: 0, panY: 0, t: 0 }
let pinchStart = { dist: 0, scale: 1 }
let lastTap = 0
const lastPointerType = ref('mouse')

function onPointerDown(e: PointerEvent) {
  lastPointerType.value = e.pointerType
  if (current.value?.kind !== 'image') return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinchStart = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), scale: zoom.scale }
  } else {
    start = { x: e.clientX, y: e.clientY, panX: zoom.x, panY: zoom.y, t: Date.now() }
  }
  dragging.value = true
}

function onPointerMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
    zoomAt((a!.x + b!.x) / 2, (a!.y + b!.y) / 2, pinchStart.scale * (dist / pinchStart.dist))
    return
  }
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  if (zoom.scale > 1) {
    zoom.x = start.panX + dx
    zoom.y = start.panY + dy
    clampPan()
  } else {
    swipeX.value = dx
  }
}

function onPointerUp(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return
  pointers.delete(e.pointerId)
  if (pointers.size > 0) return
  dragging.value = false

  const dx = e.clientX - start.x
  const moved = Math.hypot(dx, e.clientY - start.y)
  if (zoom.scale === 1 && Math.abs(dx) > 60 && Date.now() - start.t < 600) {
    go(dx < 0 ? 1 : -1)
  } else if (moved < 8 && e.pointerType !== 'mouse') {
    const now = Date.now()
    if (now - lastTap < 300) toggleZoom(e)
    lastTap = now
  }
  swipeX.value = 0
}

function onWheel(e: WheelEvent) {
  if (current.value?.kind !== 'image') return
  e.preventDefault()
  zoomAt(e.clientX, e.clientY, zoom.scale * Math.exp(-e.deltaY * 0.0022))
}

function onKey(e: KeyboardEvent) {
  if (index.value === null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else if ((e.key === 'f' || e.key === 'F') && props.canFavorite && current.value) emit('toggle', current.value)
  else if (e.key === 'Tab') trapFocus(e)
}

function trapFocus(e: KeyboardEvent) {
  const root = stage.value?.closest('[role="dialog"]')
  if (!root) return
  const focusables = [...root.querySelectorAll<HTMLElement>('button, a[href], video')]
  if (!focusables.length) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function onPopState() {
  if (index.value !== null) {
    pushedHistory = false
    index.value = null
  }
}

function preload(i: number) {
  const item = props.items[(i + props.items.length) % props.items.length]
  if (item?.kind === 'image') new Image().src = mediaUrl(props.token, item.id, variant.value)
}

watch(index, (value, previous) => {
  resetZoom()
  imageLoaded.value = false
  if (value !== null && previous === null) {
    returnFocus = document.activeElement as HTMLElement
    document.documentElement.style.overflow = 'hidden'
    history.pushState({ soprodLightbox: true }, '')
    pushedHistory = true
    nextTick(() => closeButton.value?.focus())
  }
  if (value === null && previous !== null) {
    document.documentElement.style.overflow = ''
    returnFocus?.focus()
  }
  if (value !== null) {
    preload(value + 1)
    preload(value - 1)
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('popstate', onPopState)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('popstate', onPopState)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <Transition
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-500 ease-out-expo"
    leave-active-class="transition duration-300"
  >
    <div
      v-if="current"
      class="fixed inset-0 z-[70] flex flex-col bg-ink text-paper"
      role="dialog"
      aria-modal="true"
      :aria-label="`Visionneuse — ${current.filename}`"
    >
      <div class="relative z-10 flex h-16 shrink-0 items-center justify-between gap-4 px-3 sm:px-6">
        <p class="caps tabular-nums text-silver">
          {{ (index ?? 0) + 1 }} <span class="text-paper/40">/</span> {{ items.length }}
          <span class="ml-4 hidden text-paper/50 sm:inline">{{ current.filename }}</span>
        </p>
        <div class="flex items-center">
          <button
            v-if="canFavorite"
            class="grid size-12 place-items-center transition-transform duration-300 ease-out-expo active:scale-90"
            :aria-pressed="Boolean(current.favorite)"
            :aria-label="current.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            :title="current.favorite ? 'Retirer des favoris (F)' : 'Ajouter aux favoris (F)'"
            @click="emit('toggle', current)"
          >
            <SoIcon name="heart" :size="22" :filled="current.favorite" />
          </button>
          <button
            v-if="canDownload"
            class="grid size-12 place-items-center"
            :aria-label="`Télécharger l’original ${current.filename}`"
            title="Télécharger l’original"
            @click="emit('download', current)"
          >
            <SoIcon name="download" :size="22" />
          </button>
          <button ref="closeButton" class="grid size-12 place-items-center" aria-label="Fermer la visionneuse" title="Fermer (Échap)" @click="close">
            <SoIcon name="close" :size="22" />
          </button>
        </div>
      </div>

      <div
        ref="stage"
        class="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel="onWheel"
        @dblclick="lastPointerType === 'mouse' && toggleZoom($event)"
      >
        <Transition
          mode="out-in"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
          enter-active-class="transition-opacity duration-300"
          leave-active-class="transition-opacity duration-150"
        >
          <div
            :key="current.id"
            class="absolute inset-0 flex items-center justify-center p-2 sm:px-20 sm:pb-8"
            :style="{ transform: `translateX(${swipeX}px)`, transition: dragging ? 'none' : 'transform .5s var(--ease-out-expo)' }"
          >
            <img
              v-if="current.kind === 'image'"
              :src="mediaUrl(token, current.id, variant)"
              :alt="current.filename"
              draggable="false"
              class="max-h-full max-w-full object-contain"
              :class="zoom.scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'"
              :style="{
                transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                transition: dragging ? 'none' : 'transform .55s var(--ease-out-expo), opacity .4s',
                opacity: imageLoaded ? 1 : 0,
              }"
              @load="imageLoaded = true"
            >
            <video
              v-else
              :key="`v-${current.id}`"
              :src="mediaUrl(token, current.id, 'video')"
              :poster="current.hasPoster ? mediaUrl(token, current.id, 'poster') : undefined"
              class="max-h-full max-w-full bg-ink"
              controls
              playsinline
              preload="metadata"
              autoplay
            />
          </div>
        </Transition>
        <div v-if="current.kind === 'image' && !imageLoaded" class="pointer-events-none absolute inset-0 grid place-items-center">
          <span class="caps animate-pulse text-silver">Chargement</span>
        </div>
      </div>

      <button
        class="absolute left-2 top-1/2 z-10 hidden size-14 -translate-y-1/2 place-items-center text-paper/70 transition-colors hover:text-paper sm:grid"
        aria-label="Image précédente"
        @click="go(-1)"
      >
        <SoIcon name="chevron-left" :size="30" />
      </button>
      <button
        class="absolute right-2 top-1/2 z-10 hidden size-14 -translate-y-1/2 place-items-center text-paper/70 transition-colors hover:text-paper sm:grid"
        aria-label="Image suivante"
        @click="go(1)"
      >
        <SoIcon name="chevron-right" :size="30" />
      </button>
      <p class="caps pointer-events-none pb-4 text-center text-paper/60 sm:hidden">Balayez pour naviguer · double-touchez pour zoomer</p>
    </div>
  </Transition>
</template>
