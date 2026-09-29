export default defineEventHandler(async (event) => {
  const g = requireGallery(event)
  const media = listMedia(g.id).map(m => ({
    id: m.id,
    kind: m.kind,
    filename: m.filename,
    path: m.path,
    width: m.width,
    height: m.height,
    tone: m.tone,
    sizeBytes: m.size_bytes,
    favorite: m.favorite === 1,
    cached: m.cached === 1,
  }))
  return { ...(await adminGalleryView(g)), media }
})
