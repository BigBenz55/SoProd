export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]!
  if (!path.startsWith('/api/admin/')) return
  if (path === '/api/admin/login' || path === '/api/admin/me') return
  requireAdmin(event)
})
