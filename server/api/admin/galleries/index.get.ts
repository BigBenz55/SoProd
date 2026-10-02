export default defineEventHandler(async () => {
  try {
    const rows = await listGalleries()
    return await Promise.all(rows.map(adminGalleryView))
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: `Galeries : ${message}` })
  }
})
