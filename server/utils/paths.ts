import { mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

let resolved: { data: string; cache: string; db: string } | null = null

export function dataPaths() {
  if (resolved) return resolved
  const config = useRuntimeConfig()
  const data = resolve(process.cwd(), config.dataDir || './.data')
  const cache = join(data, 'cache')
  mkdirSync(cache, { recursive: true })
  resolved = { data, cache, db: join(data, 'soprod.db') }
  return resolved
}

export function galleryCacheDir(galleryId: number) {
  return join(dataPaths().cache, String(galleryId))
}
