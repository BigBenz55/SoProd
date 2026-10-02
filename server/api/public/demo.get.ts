import { sqlGet } from '../../utils/sql-engine'

export default defineEventHandler(async () => {
  const row = await sqlGet<{ private_token: string; public_token: string }>(
    `SELECT private_token, public_token FROM galleries WHERE is_demo = 1 AND status = 'ready' ORDER BY id LIMIT 1`,
  )
  if (!row) return { privateToken: null, publicToken: null }
  return { privateToken: row.private_token, publicToken: row.public_token }
})
