export default defineEventHandler(async (event) => {
  const access = await requireViewer(event)
  if (!canDownload(access)) {
    throw createError({ statusCode: 403, message: 'Le téléchargement n’est pas ouvert sur ce lien.' })
  }
  const media = await getMedia(access.gallery.id, Number(getRouterParam(event, 'id')))
  if (!media) throw createError({ statusCode: 404, message: 'Fichier introuvable' })
  return streamFromStorage(event, media, { attachment: true })
})
