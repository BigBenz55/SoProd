import { sqlRun } from '../../../../utils/sql-engine'

export default defineEventHandler(async (event) => {
  const g = await requireGallery(event)
  const { mediaId } = await readBody<{ mediaId: number }>(event)
  const media = await getMedia(g.id, Number(mediaId))
  if (!media) throw createError({ statusCode: 404, message: 'Fichier introuvable' })
  await sqlRun('UPDATE galleries SET cover_media_id = ? WHERE id = ?', [media.id, g.id])
  return adminGalleryView((await getGallery(g.id))!)
})
