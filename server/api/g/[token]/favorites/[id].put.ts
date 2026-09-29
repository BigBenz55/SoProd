export default defineEventHandler(async (event) => {
  const access = requireViewer(event)
  if (access.role !== 'client') {
    throw createError({ statusCode: 403, message: 'Les favoris sont réservés aux mariés.' })
  }
  const media = getMedia(access.gallery.id, Number(getRouterParam(event, 'id')))
  if (!media) throw createError({ statusCode: 404, message: 'Fichier introuvable' })

  const { favorite } = await readBody<{ favorite?: boolean }>(event)
  useDb()
    .prepare(`UPDATE media SET favorite = ?, favorited_at = CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id = ?`)
    .run(favorite ? 1 : 0, favorite ? 1 : 0, media.id)
  return { id: media.id, favorite: Boolean(favorite) }
})
