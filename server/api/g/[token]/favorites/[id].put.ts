import { sqlNow, sqlRun } from '../../../../utils/sql-engine'

export default defineEventHandler(async (event) => {
  const access = await requireViewer(event)
  if (access.role !== 'client') {
    throw createError({ statusCode: 403, message: 'Les favoris sont réservés aux mariés.' })
  }
  const media = await getMedia(access.gallery.id, Number(getRouterParam(event, 'id')))
  if (!media) throw createError({ statusCode: 404, message: 'Fichier introuvable' })

  const { favorite } = await readBody<{ favorite?: boolean }>(event)
  await sqlRun('UPDATE media SET favorite = ?, favorited_at = ? WHERE id = ?', [
    favorite ? 1 : 0,
    favorite ? sqlNow() : null,
    media.id,
  ])
  return { id: media.id, favorite: Boolean(favorite) }
})
