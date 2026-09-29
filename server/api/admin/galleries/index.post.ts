export default defineEventHandler(async (event) => {
  const body = await readBody<GalleryInput>(event)
  validateGalleryInput(body, true)
  const validity = Number(body.validityDays ?? 60)
  if (!isValidityChoice(validity)) throw createError({ statusCode: 422, message: 'Validité du lien invalide.' })

  const { id } = useDb()
    .prepare(`
      INSERT INTO galleries (name, event_date, event_type, folder, private_token, public_token, pin_hash, public_download, validity_days, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `)
    .get(
      body.name!.trim(),
      body.eventDate || null,
      body.eventType ?? 'mariage',
      body.folder ? cleanRemotePath(body.folder) : null,
      newToken(),
      newToken(),
      body.pin ? hashPin(body.pin) : null,
      body.publicDownload ? 1 : 0,
      validity,
      expiresAtForValidity(validity),
    ) as { id: number }

  return adminGalleryView(getGallery(id)!)
})
