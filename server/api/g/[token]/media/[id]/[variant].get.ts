import { existsSync, createReadStream, statSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  const access = requireViewer(event)
  const mediaId = Number(getRouterParam(event, 'id'))
  const requested = getRouterParam(event, 'variant') as Variant
  if (!['thumb', 'large', 'public', 'poster'].includes(requested)) {
    throw createError({ statusCode: 404, message: 'Format inconnu' })
  }

  const media = getMedia(access.gallery.id, mediaId)
  if (!media) throw createError({ statusCode: 404, message: 'Fichier introuvable' })

  // Guests never receive the private high-definition proxy.
  const variant: Variant = requested === 'large' && access.role === 'guest' ? 'public' : requested
  const file = variantPath(access.gallery.id, media.id, variant)

  if (!existsSync(file)) {
    if (media.kind !== 'image') throw createError({ statusCode: 404, message: 'Aperçu indisponible' })
    try {
      const buffer = await readToBuffer(await useBox().read(media.path))
      await buildImageVariants(access.gallery.id, media.id, buffer)
      useDb().prepare('UPDATE media SET cached = 1 WHERE id = ?').run(media.id)
    } catch {
      throw createError({ statusCode: 503, message: 'Aperçu momentanément indisponible' })
    }
  }

  const { size, mtimeMs } = statSync(file)
  const etag = `W/"${media.id}-${variant}-${Math.round(mtimeMs)}"`
  setResponseHeader(event, 'ETag', etag)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=604800, immutable')
  if (getRequestHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return ''
  }
  setResponseHeader(event, 'Content-Type', 'image/webp')
  setResponseHeader(event, 'Content-Length', size)
  return sendStream(event, createReadStream(file))
})
