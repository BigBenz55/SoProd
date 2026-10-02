import {
  adminGalleryView,
  isValidityChoice,
  validateGalleryInput,
  type GalleryInput,
} from '../../../utils/admin-view'
import { assertJsonSerializable } from '../../../utils/json-safe'

export default defineEventHandler(async (event) => {
  try {
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

    const gallery = await getGallery(id)
    if (!gallery) {
      throw createError({ statusCode: 500, message: `Galerie créée (id ${id}) mais lecture impossible.` })
    }
    const payload = await adminGalleryView(gallery)
    assertJsonSerializable(payload, 'Galerie créée')
    return payload
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: `Création galerie : ${message}` })
  }
})
