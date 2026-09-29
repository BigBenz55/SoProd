export default defineEventHandler(() => {
  const row = useDb()
    .prepare(`SELECT private_token, public_token FROM galleries WHERE is_demo = 1 AND status = 'ready' ORDER BY id LIMIT 1`)
    .get() as { private_token: string; public_token: string } | undefined
  return row ? { privateToken: row.private_token, publicToken: row.public_token } : null
})
