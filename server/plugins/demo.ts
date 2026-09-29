import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DEMO_FOLDER = '/mariage-claire-antoine'
const DEMO_COVER = 'CA-0611.jpg'

/**
 * On a fresh local install, creates the demo gallery so the showcase has something real to open.
 * Its 90-day validity restarts at every boot so the demo never expires locally.
 */
export default defineNitroPlugin(() => {
  const { storage } = useRuntimeConfig()
  if (storage.driver !== 'local') return
  if (!existsSync(resolve(process.cwd(), storage.root || './demo-box', '.' + DEMO_FOLDER))) return

  const db = useDb()
  const existing = db.prepare('SELECT id, status FROM galleries WHERE is_demo = 1').get() as { id: number; status: string } | undefined
  if (existing) {
    db.prepare('UPDATE galleries SET validity_days = 90, expires_at = ? WHERE id = ?').run(expiryFromNow(90), existing.id)
    if (existing.status !== 'ready') startIndexing(existing.id)
    return
  }

  const { id } = db
    .prepare(`
      INSERT INTO galleries (name, event_date, event_type, folder, private_token, public_token, public_download, validity_days, expires_at, is_demo)
      VALUES ('Claire & Antoine', '2026-06-13', 'mariage', ?, ?, ?, 0, 90, ?, 1)
      RETURNING id
    `)
    .get(DEMO_FOLDER, newToken(), newToken(), expiryFromNow(90)) as { id: number }
  startIndexing(id)
  waitForIndexing(id).then(() => {
    db.prepare(`
      UPDATE galleries SET cover_media_id = (SELECT id FROM media WHERE gallery_id = ? AND filename = ?)
      WHERE id = ?
    `).run(id, DEMO_COVER, id)
  })
})
