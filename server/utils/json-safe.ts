import { createError } from 'h3'

/** Détecte les valeurs non sérialisables (ex. BigInt) avant envoi JSON — évite le 500 « Server Error » opaque. */
export function assertJsonSerializable(data: unknown, context: string) {
  try {
    JSON.stringify(data)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: `${context} : réponse JSON impossible (${detail})` })
  }
}
