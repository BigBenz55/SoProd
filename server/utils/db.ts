import { dbDriver, sqlAll, sqlGet, sqlRun } from './sql-engine'

export type EventType = 'mariage' | 'corporate' | 'studio'
export type MediaKind = 'image' | 'video'
export type GalleryStatus = 'draft' | 'indexing' | 'ready' | 'error'

export interface GalleryRow {
  id: number
  name: string
  event_date: string | null
  event_type: EventType
  folder: string | null
  private_token: string
  public_token: string
  pin_hash: string | null
  public_download: number
  validity_days: number
  expires_at: string
  cover_media_id: number | null
  status: GalleryStatus
  status_message: string | null
  is_demo: number
  created_at: string
  indexed_at: string | null
}

export interface MediaRow {
  id: number
  gallery_id: number
  path: string
  filename: string
  kind: MediaKind
  width: number | null
  height: number | null
  size_bytes: number
  tone: string | null
  position: number
  favorite: number
  favorited_at: string | null
  poster_path: string | null
  cached: number
}

export async function getGallery(id: number) {
  return sqlGet<GalleryRow>('SELECT * FROM galleries WHERE id = ?', [id])
}

export async function listMedia(galleryId: number) {
  return sqlAll<MediaRow>(
    'SELECT * FROM media WHERE gallery_id = ? ORDER BY position, filename',
    [galleryId],
  )
}

export async function getMedia(galleryId: number, mediaId: number) {
  return sqlGet<MediaRow>('SELECT * FROM media WHERE id = ? AND gallery_id = ?', [mediaId, galleryId])
}

export async function listGalleries() {
  return sqlAll<GalleryRow>(
    'SELECT * FROM galleries ORDER BY COALESCE(event_date, created_at) DESC',
  )
}

export async function insertGalleryRow(input: {
  name: string
  event_date: string | null
  event_type: string
  folder: string | null
  private_token: string
  public_token: string
  pin_hash: string | null
  public_download: number
  validity_days: number
  expires_at: string
  is_demo?: number
}) {
  const isDemo = input.is_demo ?? 0
  if (dbDriver() === 'mysql') {
    return sqlRun(
      `INSERT INTO galleries (name, event_date, event_type, folder, private_token, public_token, pin_hash, public_download, validity_days, expires_at, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.event_date,
        input.event_type,
        input.folder,
        input.private_token,
        input.public_token,
        input.pin_hash,
        input.public_download,
        input.validity_days,
        input.expires_at,
        isDemo,
      ],
    )
  }
  const row = await sqlGet<{ id: number }>(
    `INSERT INTO galleries (name, event_date, event_type, folder, private_token, public_token, pin_hash, public_download, validity_days, expires_at, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      input.name,
      input.event_date,
      input.event_type,
      input.folder,
      input.private_token,
      input.public_token,
      input.pin_hash,
      input.public_download,
      input.validity_days,
      input.expires_at,
      isDemo,
    ],
  )
  if (!row) throw new Error('insert gallery failed')
  return row.id
}

export async function upsertMediaItem(input: {
  gallery_id: number
  path: string
  filename: string
  kind: string
  size_bytes: number
  position: number
  poster_path: string | null
}) {
  if (dbDriver() === 'mysql') {
    await sqlRun(
      `INSERT INTO media (gallery_id, path, filename, kind, size_bytes, position, poster_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         size_bytes = VALUES(size_bytes),
         position = VALUES(position),
         poster_path = VALUES(poster_path)`,
      [
        input.gallery_id,
        input.path,
        input.filename,
        input.kind,
        input.size_bytes,
        input.position,
        input.poster_path,
      ],
    )
    const row = await sqlGet<{ id: number }>(
      'SELECT id FROM media WHERE gallery_id = ? AND path = ?',
      [input.gallery_id, input.path],
    )
    if (!row) throw new Error('upsert media failed')
    return row.id
  }

  const row = await sqlGet<{ id: number }>(
    `INSERT INTO media (gallery_id, path, filename, kind, size_bytes, position, poster_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (gallery_id, path) DO UPDATE SET
       size_bytes = excluded.size_bytes,
       position = excluded.position,
       poster_path = excluded.poster_path
     RETURNING id`,
    [
      input.gallery_id,
      input.path,
      input.filename,
      input.kind,
      input.size_bytes,
      input.position,
      input.poster_path,
    ],
  )
  if (!row) throw new Error('upsert media failed')
  return row.id
}

/** 0 = le lien ne expire pas (cahier des charges : validité configurable, y compris permanente). */
export const VALIDITY_PERMANENT = 0

export function isPermanentValidity(days: number) {
  return days === VALIDITY_PERMANENT
}

export function isExpired(g: GalleryRow) {
  if (isPermanentValidity(g.validity_days)) return false
  const raw = String(g.expires_at).replace(' ', 'T')
  const ts = Date.parse(raw.endsWith('Z') ? raw : `${raw}Z`)
  return ts < Date.now()
}

export function expiryFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' ')
}

export function expiresAtForValidity(days: number) {
  if (isPermanentValidity(days)) return '2099-12-31 23:59:59'
  const d = new Date(Date.now() + days * 86_400_000)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}
