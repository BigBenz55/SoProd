export default defineEventHandler(async (event) => {
  const g = requireGallery(event)
  const body = await readBody<GalleryInput & { removePin?: boolean; regenerateLinks?: boolean }>(event)
  validateGalleryInput(body, false)

  const sets: string[] = []
  const values: unknown[] = []
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = ?`)
    values.push(value)
  }

  if (body.name !== undefined) set('name', body.name.trim())
  if (body.eventDate !== undefined) set('event_date', body.eventDate || null)
  if (body.eventType !== undefined) set('event_type', body.eventType)
  if (body.folder !== undefined) set('folder', body.folder ? cleanRemotePath(body.folder) : null)
  if (body.publicDownload !== undefined) set('public_download', body.publicDownload ? 1 : 0)
  if (body.pin) set('pin_hash', hashPin(body.pin))
  else if (body.removePin) set('pin_hash', null)
  if (body.validityDays !== undefined && Number(body.validityDays) !== g.validity_days) {
    const days = Number(body.validityDays)
    if (!isValidityChoice(days)) throw createError({ statusCode: 422, message: 'Validité du lien invalide.' })
    set('validity_days', days)
    set('expires_at', expiresAtForValidity(days))
  }
  if (body.regenerateLinks) {
    set('private_token', newToken())
    set('public_token', newToken())
  }

  if (sets.length) {
    useDb().prepare(`UPDATE galleries SET ${sets.join(', ')} WHERE id = ?`).run(...values, g.id)
  }
  return adminGalleryView(getGallery(g.id)!)
})
