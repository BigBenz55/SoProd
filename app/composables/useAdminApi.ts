export interface IndexJob {
  state: 'scanning' | 'processing' | 'done' | 'error'
  total: number
  done: number
  current: string | null
  errors: string[]
}

export interface AdminGallery {
  id: number
  name: string
  eventDate: string | null
  eventType: 'mariage' | 'corporate' | 'studio'
  folder: string | null
  privateToken: string
  publicToken: string
  hasPin: boolean
  publicDownload: boolean
  validityDays: number
  expiresAt: string
  expired: boolean
  coverMediaId: number | null
  status: 'draft' | 'indexing' | 'ready' | 'error'
  statusMessage: string | null
  isDemo: boolean
  createdAt: string
  indexedAt: string | null
  counts: { total: number; images: number; videos: number; favorites: number }
  cacheBytes: number
  job: IndexJob | null
}

export interface AdminMedia {
  id: number
  kind: 'image' | 'video'
  filename: string
  path: string
  width: number | null
  height: number | null
  tone: string | null
  sizeBytes: number
  favorite: boolean
  cached: boolean
}

export const ADMIN_VALIDITY_OPTIONS = [
  { value: 30, label: '30 jours' },
  { value: 60, label: '60 jours' },
  { value: 90, label: '90 jours' },
  { value: 0, label: 'Sans expiration' },
] as const

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  const units = ['Ko', 'Mo', 'Go', 'To']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: v < 10 ? 1 : 0 })} ${units[i]}`
}

export async function adminLogout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/connexion')
}
