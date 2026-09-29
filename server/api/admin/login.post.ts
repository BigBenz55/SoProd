export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig().adminPassword) {
    throw createError({ statusCode: 500, message: 'NUXT_ADMIN_PASSWORD n’est pas configuré sur le serveur.' })
  }
  if (!rateLimit(`admin:${clientIp(event)}`, 8)) {
    throw createError({ statusCode: 429, message: 'Trop de tentatives. Réessayez dans 10 minutes.' })
  }
  const { password } = await readBody<{ password?: string }>(event)
  if (!password || !checkAdminPassword(password)) {
    throw createError({ statusCode: 401, message: 'Mot de passe incorrect.' })
  }
  setAdminSession(event)
  return { ok: true }
})
