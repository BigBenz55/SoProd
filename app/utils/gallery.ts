export interface GalleryItem {
  id: number
  kind: 'image' | 'video'
  filename: string
  width: number
  height: number
  tone: string | null
  hasPoster: boolean
  favorite?: boolean
}

/** 0 = lien sans date d’expiration. */
export const VALIDITY_PERMANENT = 0

export interface GallerySummary {
  name: string
  eventDate: string | null
  eventType: 'mariage' | 'corporate' | 'studio'
  expiresAt: string
  validityDays: number
  isDemo: boolean
  coverId?: number | null
  canDownload?: boolean
  canFavorite?: boolean
}

export interface GalleryPayload {
  state: 'open' | 'locked' | 'expired'
  role: 'client' | 'guest'
  gallery: GallerySummary
  media?: GalleryItem[]
}

export const EVENT_LABELS: Record<GallerySummary['eventType'], string> = {
  mariage: 'Mariage',
  corporate: 'Corporate',
  studio: 'Studio',
}

export function isPermanentLink(validityDays: number) {
  return validityDays === VALIDITY_PERMANENT
}

export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return ''
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value.replace(' ', 'T') + 'Z')
  return new Intl.DateTimeFormat('fr-FR', opts).format(date)
}

/** Splits "Claire & Antoine" so the ampersand can be set in italic. */
export function splitNames(name: string) {
  const parts = name.split(/\s*&\s*/)
  return parts.length === 2 ? { first: parts[0]!, second: parts[1]! } : null
}

export function mediaUrl(token: string, id: number, variant: 'thumb' | 'large' | 'public' | 'poster' | 'video' | 'download') {
  return `/api/g/${token}/media/${id}/${variant}`
}
