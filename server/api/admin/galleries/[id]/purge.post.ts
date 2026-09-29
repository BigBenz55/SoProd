export default defineEventHandler(async (event) => {
  const g = requireGallery(event)
  await purgeCache(g.id)
  useDb().prepare(`UPDATE galleries SET status = 'draft', status_message = 'Cache purgé' WHERE id = ?`).run(g.id)
  return adminGalleryView(getGallery(g.id)!)
})
