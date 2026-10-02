import { posix } from 'node:path'
import type { StorageDriver } from './storage'
import { sqlNow, sqlRun } from './sql-engine'

export interface IndexJob {
  galleryId: number
  state: 'scanning' | 'processing' | 'done' | 'error'
  total: number
  done: number
  current: string | null
  errors: string[]
  startedAt: number
  finishedAt: number | null
}

const jobs = new Map<number, IndexJob>()
const indexTasks = new Map<number, Promise<void>>()

export function getIndexJob(galleryId: number) {
  return jobs.get(galleryId) ?? null
}

export function waitForIndexing(galleryId: number) {
  return indexTasks.get(galleryId) ?? Promise.resolve()
}

async function collectStorageFiles(folder: string): Promise<StorageEntry[]> {
  const storage = useBox()
  if (storage.walkDir) return storage.walkDir(folder, 3)
  return walkStorageTree(storage, folder)
}

async function walkStorageTree(storage: StorageDriver, dir: string, depth = 0): Promise<StorageEntry[]> {
  const entries = await storage.list(dir)
  const files: StorageEntry[] = []
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))) {
    if (e.type === 'dir' && depth < 3) files.push(...(await walkStorageTree(storage, e.path, depth + 1)))
    else if (e.type === 'file') files.push(e)
  }
  return files
}

export function startIndexing(galleryId: number, force = false) {
  const active = jobs.get(galleryId)
  if (active && (active.state === 'scanning' || active.state === 'processing')) return active

  const job: IndexJob = {
    galleryId,
    state: 'scanning',
    total: 0,
    done: 0,
    current: null,
    errors: [],
    startedAt: Date.now(),
    finishedAt: null,
  }
  jobs.set(galleryId, job)
  const task = runIndexing(job, force).catch(async (err) => {
    job.state = 'error'
    job.errors.push(String(err?.message ?? err))
    job.finishedAt = Date.now()
    await sqlRun(`UPDATE galleries SET status = 'error', status_message = ? WHERE id = ?`, [
      String(err?.message ?? err),
      galleryId,
    ])
  })
  indexTasks.set(galleryId, task)
  return job
}

async function runIndexing(job: IndexJob, force: boolean) {
  const gallery = await getGallery(job.galleryId)
  if (!gallery?.folder) throw new Error('Aucun dossier sélectionné pour cette galerie')
  await sqlRun(`UPDATE galleries SET status = 'indexing', status_message = NULL WHERE id = ?`, [gallery.id])

  const storage = useBox()
  const files = await collectStorageFiles(gallery.folder)

  const byStem = new Map<string, StorageEntry>()
  for (const f of files) if (IMAGE_EXT.has(extOf(f.name))) byStem.set(f.path.slice(0, -extOf(f.name).length), f)

  const videos = files.filter(f => VIDEO_EXT.has(extOf(f.name)))
  const posters = new Map<string, StorageEntry>()
  for (const v of videos) {
    const stem = v.path.slice(0, -extOf(v.name).length)
    const poster = byStem.get(stem)
    if (poster) posters.set(v.path, poster)
  }
  const posterPaths = new Set([...posters.values()].map(p => p.path))
  const items = files.filter(f =>
    (IMAGE_EXT.has(extOf(f.name)) && !posterPaths.has(f.path)) || VIDEO_EXT.has(extOf(f.name)),
  )

  const existing = new Map((await listMedia(gallery.id)).map(m => [m.path, m]))
  const keep = new Set(items.map(i => i.path))
  for (const [, m] of existing) {
    if (!keep.has(m.path)) await sqlRun('DELETE FROM media WHERE id = ?', [m.id])
  }

  const rows: { id: number; kind: string; item: StorageEntry }[] = []
  for (let position = 0; position < items.length; position++) {
    const item = items[position]
    const kind = VIDEO_EXT.has(extOf(item.name)) ? 'video' : 'image'
    const id = await upsertMediaItem({
      gallery_id: gallery.id,
      path: item.path,
      filename: posix.basename(item.path),
      kind,
      size_bytes: item.size,
      position,
      poster_path: posters.get(item.path)?.path ?? null,
    })
    rows.push({ id, kind, item })
  }

  job.state = 'processing'
  job.total = rows.length

  const queue = [...rows]
  const worker = async () => {
    while (queue.length) {
      const row = queue.shift()!
      job.current = row.item.name
      try {
        const known = existing.get(row.item.path)
        const fresh = !force && known?.cached && hasCachedVariants(gallery.id, row.id, row.kind as MediaKind)
        if (!fresh) {
          if (row.kind === 'image') {
            const buffer = await readToBuffer(await storage.read(row.item.path))
            const meta = await buildImageVariants(gallery.id, row.id, buffer)
            await sqlRun('UPDATE media SET width = ?, height = ?, tone = ?, cached = 1 WHERE id = ?', [
              meta.width,
              meta.height,
              meta.tone,
              row.id,
            ])
          } else {
            const poster = posters.get(row.item.path)
            if (poster) {
              const buffer = await readToBuffer(await storage.read(poster.path))
              const meta = await buildPoster(gallery.id, row.id, buffer)
              await sqlRun('UPDATE media SET width = ?, height = ?, tone = ?, cached = 1 WHERE id = ?', [
                meta.width,
                meta.height,
                '#111111',
                row.id,
              ])
            } else {
              await sqlRun('UPDATE media SET width = ?, height = ?, tone = ?, cached = 1 WHERE id = ?', [
                1920,
                1080,
                '#111111',
                row.id,
              ])
            }
          }
        }
      } catch (err: any) {
        job.errors.push(`${row.item.name} : ${err?.message ?? err}`)
      }
      job.done++
    }
  }
  const workers = storage.kind === 'local' ? 2 : 1
  await Promise.all(Array.from({ length: workers }, () => worker()))

  const g = await getGallery(gallery.id)
  if (g && (!g.cover_media_id || !keep.size || !rows.some(r => r.id === g.cover_media_id))) {
    const firstImage = rows.find(r => r.kind === 'image')
    await sqlRun('UPDATE galleries SET cover_media_id = ? WHERE id = ?', [firstImage?.id ?? null, gallery.id])
  }
  await sqlRun(`UPDATE galleries SET status = 'ready', indexed_at = ?, status_message = ? WHERE id = ?`, [
    sqlNow(),
    job.errors.length ? `${job.errors.length} fichier(s) en erreur` : null,
    gallery.id,
  ])

  job.current = null
  job.state = 'done'
  job.finishedAt = Date.now()
}
