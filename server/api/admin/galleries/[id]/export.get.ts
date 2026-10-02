import { posix } from 'node:path'

/**
 * Lightroom's Library filter (Text › Filename › Contains) treats commas as "or",
 * so the first line can be pasted as-is. The full list follows for reference.
 */
export default defineEventHandler(async (event) => {
  const g = await requireGallery(event)
  const favorites = (await listMedia(g.id)).filter(m => m.favorite === 1)
  const stems = favorites.map(m => posix.basename(m.filename, posix.extname(m.filename)))

  const slug = g.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="favoris-${slug || g.id}.txt"`)

  return [
    stems.join(', '),
    '',
    `# ${g.name} — ${favorites.length} favori(s)`,
    ...favorites.map(m => m.filename),
    '',
  ].join('\r\n')
})
