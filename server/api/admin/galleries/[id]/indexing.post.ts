export default defineEventHandler(async (event) => {
  const g = requireGallery(event)
  if (!g.folder) throw createError({ statusCode: 422, message: 'Choisissez d’abord le dossier de la galerie sur le disque.' })
  const { force } = (await readBody<{ force?: boolean }>(event).catch(() => ({}))) ?? {}
  return startIndexing(g.id, Boolean(force))
})
