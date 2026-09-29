let last: { at: number; online: boolean } | null = null

/** Whether originals can be fetched right now; the Box can be offline while thumbnails keep working. */
export default defineEventHandler(async (event) => {
  requireViewer(event)
  if (!last || Date.now() - last.at > 30_000) {
    last = { at: Date.now(), online: await useBox().ping() }
  }
  return { online: last.online }
})
