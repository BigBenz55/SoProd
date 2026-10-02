import type { H3Event } from 'h3'
import { sqlGet } from './sql-engine'

export type AccessRole = 'client' | 'guest'

export interface GalleryAccess {
  gallery: GalleryRow
  role: AccessRole
  unlocked: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function unlockCookieName(galleryId: number) {
  return `sp_pin_${galleryId}`
}

function unlockValue(g: GalleryRow) {
  return sign(`${g.id}.${g.private_token}.${g.pin_hash}`)
}

export function setUnlocked(event: H3Event, g: GalleryRow) {
  setCookie(event, unlockCookieName(g.id), unlockValue(g), {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 30 * 86_400,
  })
}

export async function resolveAccess(event: H3Event, token: string | undefined): Promise<GalleryAccess> {
  if (!token || !UUID_RE.test(token)) throw createError({ statusCode: 404, message: 'Galerie introuvable' })
  const privateHit = await sqlGet<GalleryRow>('SELECT * FROM galleries WHERE private_token = ?', [token])
  const gallery =
    privateHit ?? (await sqlGet<GalleryRow>('SELECT * FROM galleries WHERE public_token = ?', [token]))
  if (!gallery) throw createError({ statusCode: 404, message: 'Galerie introuvable' })

  const role: AccessRole = privateHit ? 'client' : 'guest'
  const unlocked =
    role === 'guest'
    || !gallery.pin_hash
    || getCookie(event, unlockCookieName(gallery.id)) === unlockValue(gallery)
    || isAdmin(event)
  return { gallery, role, unlocked }
}

/** Access check for every media/favourite endpoint: token valid, not expired, PIN satisfied. */
export async function requireViewer(event: H3Event) {
  const access = await resolveAccess(event, getRouterParam(event, 'token'))
  if (isExpired(access.gallery) && !isAdmin(event)) throw createError({ statusCode: 410, message: 'Galerie expirée' })
  if (!access.unlocked) throw createError({ statusCode: 403, message: 'Code PIN requis' })
  return access
}

export function canDownload(access: GalleryAccess) {
  return access.role === 'client' || access.gallery.public_download === 1
}
