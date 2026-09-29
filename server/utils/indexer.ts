import { posix } from 'node:path'

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

async function walk(dir: string, depth = 0): Promise<StorageEntry[]> {
  const storage = useBox()
  const entries = await storage.list(dir)
  const files: StorageEntry[] = []
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))) {
    if (e.type === 'dir' && depth < 3) files.push(...(await walk(e.path, depth + 1)))
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
  const task = runIndexing(job, force).catch((err) => {
    job.state = 'error'
    job.errors.push(String(err?.message ?? err))
    job.finishedAt = Date.now()
    useDb()
      .prepare(`UPDATE galleries SET status = 'error', status_message = ? WHERE id = ?`)
      .run(String(err?.message ?? err), galleryId)
  })
  indexTasks.set(galleryId, task)
  return job
}

async function runIndexing(job: IndexJob, force: boolean) {
  const db = useDb()
  const gallery = getGallery(job.galleryId)
  if (!gallery?.folder) throw new Error('Aucun dossier sélectionné pour cette galerie')
  db.prepare(`UPDATE galleries SET status = 'indexing', status_message = NULL WHERE id = ?`).run(gallery.id)

  const storage = useBox()
  const files = await walk(gallery.folder)

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

  const existing = new Map(listMedia(gallery.id).map(m => [m.path, m]))
  const keep = new Set(items.map(i => i.path))
  for (const [path, m] of existing) {
    if (!keep.has(path)) db.prepare('DELETE FROM media WHERE id = ?').run(m.id)
  }

  const upsert = db.prepare(`
    INSERT INTO media (gallery_id, path, filename, kind, size_bytes, position, poster_path)
    VALUES (@gallery_id, @path, @filename, @kind, @size_bytes, @position, @poster_path)
    ON CONFLICT (gallery_id, path) DO UPDATE SET
      size_bytes = excluded.size_bytes, position = excluded.position, poster_path = excluded.poster_path
    RETURNING id
  `)
  const rows = items.map((item, position) => {
    const kind = VIDEO_EXT.has(extOf(item.name)) ? 'video' : 'image'
    const { id } = upsert.get({
      gallery_id: gallery.id,
      path: item.path,
      filename: posix.basename(item.path),
      kind,
      size_bytes: item.size,
      position,
      poster_path: posters.get(item.path)?.path ?? null,
    }) as { id: number }
    return { id, kind, item }
  })

  job.state = 'processing'
  job.total = rows.length

  const update = db.prepare(
    'UPDATE media SET width = ?, height = ?, tone = ?, cached = 1 WHERE id = ?',
  )
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
            update.run(meta.width, meta.height, meta.tone, row.id)
          } else {
            const poster = posters.get(row.item.path)
            if (poster) {
              const buffer = await readToBuffer(await storage.read(poster.path))
              const meta = await buildPoster(gallery.id, row.id, buffer)
              update.run(meta.width, meta.height, '#111111', row.id)
            } else {
              update.run(1920, 1080, '#111111', row.id)
            }
          }
        }
      } catch (err: any) {
        job.errors.push(`${row.item.name} : ${err?.message ?? err}`)
      }
      job.done++
    }
  }
  await Promise.all([worker(), worker()])

  const g = getGallery(gallery.id)
  if (g && (!g.cover_media_id || !keep.size || !rows.some(r => r.id === g.cover_media_id))) {
    const firstImage = rows.find(r => r.kind === 'image')
    db.prepare('UPDATE galleries SET cover_media_id = ? WHERE id = ?').run(firstImage?.id ?? null, gallery.id)
  }
  db.prepare(`UPDATE galleries SET status = 'ready', indexed_at = datetime('now'), status_message = ? WHERE id = ?`)
    .run(job.errors.length ? `${job.errors.length} fichier(s) en erreur` : null, gallery.id)

  job.current = null
  job.state = 'done'
  job.finishedAt = Date.now()
}
