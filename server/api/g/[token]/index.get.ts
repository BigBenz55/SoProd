export default defineEventHandler(async (event) => {
  const access = await resolveAccess(event, getRouterParam(event, 'token'))
  const { gallery: g, role } = access

  const summary = {
    name: g.name,
    eventDate: g.event_date,
    eventType: g.event_type,
    expiresAt: g.expires_at,
    validityDays: g.validity_days,
    isDemo: g.is_demo === 1,
  }

  if (isExpired(g) && !isAdmin(event)) return { state: 'expired' as const, role, gallery: summary }
  if (!access.unlocked) return { state: 'locked' as const, role, gallery: summary }

  const media = (await listMedia(g.id))
    .filter(m => m.cached || m.kind === 'video')
    .map(m => ({
      id: m.id,
      kind: m.kind,
      filename: m.filename,
      width: m.width ?? 3,
      height: m.height ?? 2,
      tone: m.tone,
      hasPoster: Boolean(m.poster_path),
      favorite: role === 'client' ? m.favorite === 1 : undefined,
    }))

  return {
    state: 'open' as const,
    role,
    gallery: {
      ...summary,
      coverId: g.cover_media_id ?? media.find(m => m.kind === 'image')?.id ?? null,
      canDownload: canDownload(access),
      canFavorite: role === 'client',
    },
    media,
  }
})
