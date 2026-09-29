export default defineEventHandler(async () => {
  const storage = useBox()
  const started = Date.now()
  const online = await storage.ping()
  return { driver: storage.kind, online, latencyMs: Date.now() - started }
})
