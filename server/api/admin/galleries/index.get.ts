export default defineEventHandler(async () => {
  const rows = useDb().prepare('SELECT * FROM galleries ORDER BY COALESCE(event_date, created_at) DESC').all() as GalleryRow[]
  return Promise.all(rows.map(adminGalleryView))
})
