import { sqlRun } from '../../../../utils/sql-engine'

export default defineEventHandler(async (event) => {
  const g = await requireGallery(event)
  await purgeCache(g.id)
  await sqlRun(`UPDATE galleries SET status = 'draft', status_message = ? WHERE id = ?`, ['Cache purgé', g.id])
  return adminGalleryView((await getGallery(g.id))!)
})
