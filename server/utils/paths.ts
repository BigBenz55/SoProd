import { mkdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'

let resolved: { data: string; cache: string; db: string } | null = null

export function dataPaths() {
  if (resolved) return resolved
  const config = useRuntimeConfig()
  const data = resolve(process.cwd(), config.dataDir || './.data')
  const cache = join(data, 'cache')
  const db = join(data, 'soprod.db')
  try {
    mkdirSync(dirname(db), { recursive: true })
    mkdirSync(cache, { recursive: true })
  } catch (err) {
    console.error('[soprod] NUXT_DATA_DIR inaccessible :', data, err)
    throw err
  }
  resolved = { data, cache, db }
  return resolved
}

export function galleryCacheDir(galleryId: number) {
  return join(dataPaths().cache, String(galleryId))
}
