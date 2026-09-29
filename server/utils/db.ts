import Database from 'better-sqlite3'

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

let db: Database.Database | null = null

export function useDb() {
  if (db) return db
  db = new Database(dataPaths().db)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS galleries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      event_date TEXT,
      event_type TEXT NOT NULL DEFAULT 'mariage',
      folder TEXT,
      private_token TEXT NOT NULL UNIQUE,
      public_token TEXT NOT NULL UNIQUE,
      pin_hash TEXT,
      public_download INTEGER NOT NULL DEFAULT 0,
      validity_days INTEGER NOT NULL DEFAULT 60,
      expires_at TEXT NOT NULL,
      cover_media_id INTEGER,
      status TEXT NOT NULL DEFAULT 'draft',
      status_message TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      indexed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      filename TEXT NOT NULL,
      kind TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      tone TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      favorite INTEGER NOT NULL DEFAULT 0,
      favorited_at TEXT,
      poster_path TEXT,
      cached INTEGER NOT NULL DEFAULT 0,
      UNIQUE (gallery_id, path)
    );
    CREATE INDEX IF NOT EXISTS media_gallery ON media (gallery_id, position);
  `)
  return db
}

export function getGallery(id: number) {
  return useDb().prepare('SELECT * FROM galleries WHERE id = ?').get(id) as GalleryRow | undefined
}

export function listMedia(galleryId: number) {
  return useDb()
    .prepare('SELECT * FROM media WHERE gallery_id = ? ORDER BY position, filename')
    .all(galleryId) as MediaRow[]
}

export function getMedia(galleryId: number, mediaId: number) {
  return useDb()
    .prepare('SELECT * FROM media WHERE id = ? AND gallery_id = ?')
    .get(mediaId, galleryId) as MediaRow | undefined
}

/** 0 = le lien ne expire pas (cahier des charges : validité configurable, y compris permanente). */
export const VALIDITY_PERMANENT = 0

export function isPermanentValidity(days: number) {
  return days === VALIDITY_PERMANENT
}

export function isExpired(g: GalleryRow) {
  if (isPermanentValidity(g.validity_days)) return false
  return new Date(g.expires_at + 'Z').getTime() < Date.now()
}

export function expiryFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' ')
}

export function expiresAtForValidity(days: number) {
  if (isPermanentValidity(days)) return '2099-12-31 23:59:59'
  return expiryFromNow(days)
}
