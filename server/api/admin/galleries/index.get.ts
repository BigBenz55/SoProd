export default defineEventHandler(async () => {
  const rows = await listGalleries()
  return Promise.all(rows.map(adminGalleryView))
})
