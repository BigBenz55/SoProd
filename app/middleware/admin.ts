export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/connexion') return
  const { authenticated } = await $fetch<{ authenticated: boolean }>('/api/admin/me')
  if (!authenticated) return navigateTo({ path: '/admin/connexion', query: { suite: to.fullPath } })
})
