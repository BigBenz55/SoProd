export default defineEventHandler(async (event) => {
  const access = await resolveAccess(event, getRouterParam(event, 'token'))
  const { gallery } = access
  if (access.unlocked) return { ok: true }

  if (!rateLimit(`pin:${gallery.id}:${clientIp(event)}`)) {
    throw createError({ statusCode: 429, message: 'Trop de tentatives. Réessayez dans 10 minutes.' })
  }

  const body = await readBody<{ pin?: string }>(event)
  const pin = String(body?.pin ?? '')
  if (!/^\d{4}$/.test(pin) || !verifyPin(pin, gallery.pin_hash!)) {
    throw createError({ statusCode: 401, message: 'Ce code ne correspond pas. Vérifiez le message reçu avec votre lien.' })
  }
  setUnlocked(event, gallery)
  return { ok: true }
})
