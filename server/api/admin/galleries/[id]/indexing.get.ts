export default defineEventHandler(async (event) => {
  const g = await requireGallery(event)
  return getIndexJob(g.id)
})
