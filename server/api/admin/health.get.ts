import { dbDriver, initSqlEngine } from '../../utils/sql-engine'

/** Diagnostic admin : base + dossier cache (sans secrets). */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  let dbOk = false
  let dbError: string | null = null
  try {
    await initSqlEngine()
    dbOk = true
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    dbError = e?.message ?? (err instanceof Error ? err.message : String(err))
  }

  let cacheOk = false
  let cachePath = ''
  let cacheError: string | null = null
  try {
    cachePath = dataPaths().data
    cacheOk = true
  } catch (err) {
    cacheError = err instanceof Error ? err.message : String(err)
  }

  const config = useRuntimeConfig()
  return {
    db: { driver: dbDriver(), ok: dbOk, error: dbError },
    cache: { path: cachePath, ok: cacheOk, error: cacheError },
    hasDatabaseUrl: Boolean(config.databaseUrl || process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL),
  }
})
