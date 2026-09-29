export default defineEventHandler((event) => {
  const g = requireGallery(event)
  return getIndexJob(g.id)
})
