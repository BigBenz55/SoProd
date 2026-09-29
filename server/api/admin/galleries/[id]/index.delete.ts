export default defineEventHandler(async (event) => {
  const g = requireGallery(event)
  await purgeCache(g.id)
  useDb().prepare('DELETE FROM galleries WHERE id = ?').run(g.id)
  return { ok: true }
})
