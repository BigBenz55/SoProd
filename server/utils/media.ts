import { existsSync, promises as fsp } from 'node:fs'
import { join, posix } from 'node:path'
import sharp from 'sharp'

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif'])
export const VIDEO_EXT = new Set(['.mp4', '.m4v', '.mov', '.webm'])

export type Variant = 'thumb' | 'large' | 'public' | 'poster'

/**
 * thumb: grid tiles. large: private lightbox (~250 KB). public: guest lightbox, lower definition.
 */
const VARIANTS: Record<Exclude<Variant, 'poster'>, { box: [number, number]; quality: number }> = {
  thumb: { box: [800, 1200], quality: 70 },
  large: { box: [2048, 2048], quality: 78 },
  public: { box: [1280, 1280], quality: 68 },
}

export function extOf(name: string) {
  return posix.extname(name).toLowerCase()
}

export function variantPath(galleryId: number, mediaId: number, variant: Variant) {
  return join(galleryCacheDir(galleryId), `${mediaId}-${variant}.webp`)
}

export function hasCachedVariants(galleryId: number, mediaId: number, kind: 'image' | 'video') {
  if (kind === 'video') return true
  return (['thumb', 'large', 'public'] as const).every(v => existsSync(variantPath(galleryId, mediaId, v)))
}

export async function buildImageVariants(galleryId: number, mediaId: number, original: Buffer) {
  await fsp.mkdir(galleryCacheDir(galleryId), { recursive: true })
  const base = sharp(original, { failOn: 'none' }).rotate()
  const meta = await base.metadata()
  const oriented = meta.orientation && meta.orientation >= 5
  const width = oriented ? meta.height : meta.width
  const height = oriented ? meta.width : meta.height

  for (const [name, spec] of Object.entries(VARIANTS)) {
    await base
      .clone()
      .resize({ width: spec.box[0], height: spec.box[1], fit: 'inside', withoutEnlargement: true })
      .webp({ quality: spec.quality, effort: 4 })
      .toFile(variantPath(galleryId, mediaId, name as Variant))
  }

  const { dominant } = await base.clone().resize(32, 32, { fit: 'inside' }).stats()
  const tone = '#' + [dominant.r, dominant.g, dominant.b].map(c => c.toString(16).padStart(2, '0')).join('')
  return { width: width ?? null, height: height ?? null, tone }
}

export async function buildPoster(galleryId: number, mediaId: number, image: Buffer) {
  await fsp.mkdir(galleryCacheDir(galleryId), { recursive: true })
  const img = sharp(image, { failOn: 'none' }).rotate()
  const info = await img
    .clone()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(variantPath(galleryId, mediaId, 'poster'))
  return { width: info.width, height: info.height }
}

export async function cacheSize(galleryId: number) {
  const dir = galleryCacheDir(galleryId)
  if (!existsSync(dir)) return 0
  let total = 0
  for (const f of await fsp.readdir(dir)) total += (await fsp.stat(join(dir, f))).size
  return total
}

export async function purgeCache(galleryId: number) {
  await fsp.rm(galleryCacheDir(galleryId), { recursive: true, force: true })
  await sqlRun('UPDATE media SET cached = 0 WHERE gallery_id = ?', [galleryId])
}
