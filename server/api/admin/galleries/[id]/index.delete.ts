import { sqlRun } from '../../../../utils/sql-engine'

export default defineEventHandler(async (event) => {
  const g = await requireGallery(event)
  await sqlRun('DELETE FROM galleries WHERE id = ?', [g.id])
  return { ok: true }
})
