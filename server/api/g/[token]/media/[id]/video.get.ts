export default defineEventHandler(async (event) => {
  const access = requireViewer(event)
  const media = getMedia(access.gallery.id, Number(getRouterParam(event, 'id')))
  if (!media || media.kind !== 'video') throw createError({ statusCode: 404, message: 'Vidéo introuvable' })
  return streamFromStorage(event, media, { attachment: false })
})
