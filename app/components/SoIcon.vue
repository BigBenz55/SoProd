<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number; filled?: boolean }>(), { size: 20 })

const paths: Record<string, string> = {
  heart: 'M12 20.2s-7.6-4.6-8.9-9.6C2.3 7.4 4.3 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.9 1.2-1.8 2.7-2.9 4.7-2.9 3 0 5 2.9 4.2 6.1-1.3 5-8.9 9.6-8.9 9.6z',
  download: 'M12 3.5v11.8M7.2 10.6 12 15.4l4.8-4.8M4.5 19.5h15',
  close: 'M5.5 5.5l13 13M18.5 5.5l-13 13',
  'chevron-left': 'M14.8 5 7.8 12l7 7',
  'chevron-right': 'M9.2 5l7 7-7 7',
  'chevron-down': 'M5 9.2l7 7 7-7',
  'arrow-right': 'M4 12h15.5M13.5 6l6 6-6 6',
  play: 'M8 5.2v13.6L19 12 8 5.2z',
  lock: 'M6.5 10.5h11v9h-11zM8.8 10.5V7.8a3.2 3.2 0 0 1 6.4 0v2.7',
  link: 'M10.2 13.8a3.8 3.8 0 0 0 5.4 0l3-3a3.8 3.8 0 0 0-5.4-5.4l-1 1M13.8 10.2a3.8 3.8 0 0 0-5.4 0l-3 3a3.8 3.8 0 0 0 5.4 5.4l1-1',
  copy: 'M8.5 8.5h10v10h-10zM5.5 15.5v-10h10',
  folder: 'M3.5 6.5h6l2 2h9v10h-17z',
  image: 'M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 17.5M15.5 9.2a.3.3 0 1 0 0 .01',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9.5h4M4 14.5h4M16 9.5h4M16 14.5h4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  zoom: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.3 15.3 20 20M8 10.5h5M10.5 8v5',
  refresh: 'M19 12a7 7 0 1 1-2.05-4.95M19 4.5V9h-4.5',
  trash: 'M5 7h14M9.5 7V4.5h5V7M7 7l.8 12.5h8.4L17 7',
  logout: 'M14 4.5H5.5v15H14M10 12h10M16.5 8.5 20 12l-3.5 3.5',
  external: 'M13.5 4.5h6v6M19.5 4.5 11 13M17.5 14v5.5h-13v-13H10',
  grid: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
  plus: 'M12 5v14M5 12h14',
  eye: 'M2.8 12S6.2 5.8 12 5.8 21.2 12 21.2 12 17.8 18.2 12 18.2 2.8 12 2.8 12zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z',
  box: 'M4 8.5 12 4.5l8 4v7l-8 4-8-4zM4 8.5l8 4 8-4M12 12.5v7',
  mail: 'M3.5 6h17v12h-17zM3.5 6.5 12 13l8.5-6.5',
}

const d = computed(() => paths[props.name] ?? '')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="d" />
  </svg>
</template>
