export default defineEventHandler(async (event) => {
  const g = requireGallery(event)
  const { mediaId } = await readBody<{ mediaId?: number }>(event)
  const media = getMedia(g.id, Number(mediaId))
  if (!media || media.kind !== 'image') throw createError({ statusCode: 422, message: 'Choisissez une photo comme couverture.' })
  useDb().prepare('UPDATE galleries SET cover_media_id = ? WHERE id = ?').run(media.id, g.id)
  return { coverMediaId: media.id }
})
