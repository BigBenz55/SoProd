import type { H3Event } from 'h3'
import type { Readable } from 'node:stream'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
}

export function mimeOf(name: string) {
  return MIME[extOf(name)] ?? 'application/octet-stream'
}

export function parseRange(header: string | undefined, size: number) {
  if (!header?.startsWith('bytes=')) return null
  const [startRaw, endRaw] = header.slice(6).split(',')[0]!.split('-')
  let start = startRaw ? Number(startRaw) : NaN
  let end = endRaw ? Number(endRaw) : size - 1
  if (Number.isNaN(start)) {
    start = Math.max(0, size - end)
    end = size - 1
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return 'invalid' as const
  return { start, end: Math.min(end, size - 1) }
}

/**
 * Streams a file from the Box through this server, so the Box address never reaches the browser.
 */
export async function streamFromStorage(
  event: H3Event,
  media: MediaRow,
  opts: { attachment: boolean },
) {
  const storage = useBox()
  let size: number
  try {
    size = await storage.size(media.path)
  } catch {
    throw createError({
      statusCode: 503,
      message: 'Le serveur de stockage est momentanément indisponible. Réessayez dans quelques minutes.',
    })
  }

  setResponseHeader(event, 'Content-Type', mimeOf(media.filename))
  setResponseHeader(event, 'Accept-Ranges', 'bytes')
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (opts.attachment) {
    setResponseHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${media.filename.replace(/[^\w.\- ]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(media.filename)}`,
    )
  }

  const range = parseRange(getRequestHeader(event, 'range'), size)
  if (range === 'invalid') {
    setResponseStatus(event, 416)
    setResponseHeader(event, 'Content-Range', `bytes */${size}`)
    return ''
  }

  let stream: Readable
  if (range) {
    setResponseStatus(event, 206)
    setResponseHeader(event, 'Content-Range', `bytes ${range.start}-${range.end}/${size}`)
    setResponseHeader(event, 'Content-Length', range.end - range.start + 1)
    stream = await storage.read(media.path, range)
  } else {
    setResponseHeader(event, 'Content-Length', size)
    stream = await storage.read(media.path)
  }

  event.node.req.on('close', () => stream.destroy())
  return sendStream(event, stream)
}
