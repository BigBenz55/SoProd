export default defineEventHandler(async () => {
  try {
    const rows = await listGalleries()
    if (!rows.length) return []
    const payload = await Promise.all(
      rows.map(async (row) => {
        try {
          return await adminGalleryView(row)
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err)
          throw createError({ statusCode: 500, message: `Galerie #${row.id} : ${message}` })
        }
      }),
    )
    assertJsonSerializable(payload, 'Liste des galeries')
    return payload
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: `Galeries : ${message}` })
  }
})
