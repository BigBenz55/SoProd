import { existsSync } from 'node:fs'
import sharp from 'sharp'

/**
 * A tiny, heavily blurred rendition of the cover for the PIN screen: atmosphere only,
 * never recognisable before the code is entered.
 */
export default defineEventHandler(async (event) => {
  const { gallery } = await resolveAccess(event, getRouterParam(event, 'token'))
  if (isExpired(gallery) || !gallery.cover_media_id) throw createError({ statusCode: 404, message: 'Aucune couverture' })

  const file = variantPath(gallery.id, gallery.cover_media_id, 'thumb')
  if (!existsSync(file)) throw createError({ statusCode: 404, message: 'Aucune couverture' })

  const buffer = await sharp(file).resize(40).blur(3).webp({ quality: 50 }).toBuffer()
  setResponseHeader(event, 'Content-Type', 'image/webp')
  setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')
  return buffer
})
