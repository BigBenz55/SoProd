export default defineEventHandler(async (event) => {
  const path = cleanRemotePath(getQuery(event).path as string | undefined)
  try {
    const entries = await useBox().list(path)
    const dirs = entries.filter(e => e.type === 'dir').sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))
    const files = entries.filter(e => e.type === 'file')
    const media = files.filter(f => IMAGE_EXT.has(extOf(f.name)) || VIDEO_EXT.has(extOf(f.name)))
    return { path, dirs, fileCount: files.length, mediaCount: media.length }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 503, message: `Impossible de lire le disque : ${err?.message ?? err}` })
  }
})
