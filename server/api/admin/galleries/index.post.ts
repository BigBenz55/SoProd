export default defineEventHandler(async (event) => {
  const body = await readBody<GalleryInput>(event)
  validateGalleryInput(body, true)
  const validity = Number(body.validityDays ?? 60)
  if (!isValidityChoice(validity)) throw createError({ statusCode: 422, message: 'Validité du lien invalide.' })

  const id = await insertGalleryRow({
    name: body.name!.trim(),
    event_date: body.eventDate || null,
    event_type: body.eventType ?? 'mariage',
    folder: body.folder ? cleanRemotePath(body.folder) : null,
    private_token: newToken(),
    public_token: newToken(),
    pin_hash: body.pin ? hashPin(body.pin) : null,
    public_download: body.publicDownload ? 1 : 0,
    validity_days: validity,
    expires_at: expiresAtForValidity(validity),
  })

  return adminGalleryView((await getGallery(id))!)
})
