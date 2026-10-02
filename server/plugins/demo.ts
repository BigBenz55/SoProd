import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { sqlGet, sqlRun } from '../utils/sql-engine'

const DEMO_FOLDER = '/mariage-claire-antoine'
const DEMO_COVER = 'CA-0611.jpg'

/**
 * On a fresh local install, creates the demo gallery so the showcase has something real to open.
 * Its 90-day validity restarts at every boot so the demo never expires locally.
 */
export default defineNitroPlugin(async () => {
  const { storage } = useRuntimeConfig()
  if (storage.driver !== 'local') return
  if (!existsSync(resolve(process.cwd(), storage.root || './demo-box', '.' + DEMO_FOLDER))) return

  const existing = await sqlGet<{ id: number; status: string }>(
    'SELECT id, status FROM galleries WHERE is_demo = 1',
  )
  if (existing) {
    await sqlRun('UPDATE galleries SET validity_days = 90, expires_at = ? WHERE id = ?', [
      expiryFromNow(90),
      existing.id,
    ])
    if (existing.status !== 'ready') startIndexing(existing.id)
    return
  }

  const id = await insertGalleryRow({
    name: 'Claire & Antoine',
    event_date: '2026-06-13',
    event_type: 'mariage',
    folder: DEMO_FOLDER,
    private_token: newToken(),
    public_token: newToken(),
    pin_hash: null,
    public_download: 0,
    validity_days: 90,
    expires_at: expiryFromNow(90),
    is_demo: 1,
  })
  startIndexing(id)
  waitForIndexing(id).then(async () => {
    await sqlRun(
      `UPDATE galleries SET cover_media_id = (SELECT id FROM media WHERE gallery_id = ? AND filename = ?) WHERE id = ?`,
      [id, DEMO_COVER, id],
    )
  })
})
