import { sqlGet } from './sql-engine'

export const EVENT_TYPES: EventType[] = ['mariage', 'corporate', 'studio']
export const VALIDITY_PERMANENT = 0
export const VALIDITY_CHOICES = [30, 60, 90, VALIDITY_PERMANENT]

export function isValidityChoice(days: number) {
  return VALIDITY_CHOICES.includes(Number(days))
}

const COUNTS_SQL =
  "SELECT COUNT(*) AS total, SUM(kind = 'image') AS images, SUM(kind = 'video') AS videos, SUM(favorite) AS favorites FROM media WHERE gallery_id = ?"

export async function adminGalleryView(g: GalleryRow) {
  const counts = await sqlGet<{
    total: number
    images: number | null
    videos: number | null
    favorites: number | null
  }>(COUNTS_SQL, [g.id])
  if (!counts) {
    throw createError({ statusCode: 500, message: 'Lecture des statistiques galerie impossible.' })
  }

  return {
    id: g.id,
    name: g.name,
    eventDate: g.event_date,
    eventType: g.event_type,
    folder: g.folder,
    privateToken: g.private_token,
    publicToken: g.public_token,
    hasPin: Boolean(g.pin_hash),
    publicDownload: g.public_download === 1,
    validityDays: g.validity_days,
    expiresAt: g.expires_at,
    expired: isExpired(g),
    coverMediaId: g.cover_media_id,
    status: g.status,
    statusMessage: g.status_message,
    isDemo: g.is_demo === 1,
    createdAt: g.created_at,
    indexedAt: g.indexed_at,
    counts: {
      total: Number(counts.total),
      images: Number(counts.images ?? 0),
      videos: Number(counts.videos ?? 0),
      favorites: Number(counts.favorites ?? 0),
    },
    cacheBytes: await cacheSize(g.id),
    job: getIndexJob(g.id),
  }
}

export async function requireGallery(event: import('h3').H3Event) {
  const g = await getGallery(Number(getRouterParam(event, 'id')))
  if (!g) throw createError({ statusCode: 404, message: 'Galerie introuvable' })
  return g
}

export interface GalleryInput {
  name?: string
  eventDate?: string | null
  eventType?: EventType
  folder?: string | null
  pin?: string | null
  publicDownload?: boolean
  validityDays?: number
}

export function validateGalleryInput(body: GalleryInput, creating: boolean) {
  const errors: string[] = []
  if (creating || body.name !== undefined) {
    if (!body.name?.trim()) errors.push('Le nom du projet est obligatoire.')
  }
  if (body.eventType !== undefined && !EVENT_TYPES.includes(body.eventType)) errors.push('Type d’événement inconnu.')
  if (body.validityDays !== undefined && !isValidityChoice(Number(body.validityDays))) {
    errors.push('Choisissez 30, 60, 90 jours ou sans expiration.')
  }
  if (body.pin && !/^\d{4}$/.test(body.pin)) errors.push('Le code PIN doit comporter 4 chiffres.')
  if (body.eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.eventDate)) errors.push('Date invalide.')
  if (errors.length) throw createError({ statusCode: 422, message: errors.join(' ') })
}
