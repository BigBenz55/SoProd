import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const ADMIN_COOKIE = 'sp_admin'
const ADMIN_TTL_MS = 12 * 3600_000

let fallbackSecret: string | null = null

function secret() {
  const configured = useRuntimeConfig().sessionSecret
  if (configured && configured.length >= 16) return configured
  if (!fallbackSecret) {
    fallbackSecret = randomBytes(32).toString('hex')
    console.warn('[soprod] NUXT_SESSION_SECRET absent : sessions valables jusqu’au redémarrage uniquement.')
  }
  return fallbackSecret
}

export function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function newToken() {
  return randomUUID()
}

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(pin, salt, 32).toString('hex')}`
}

export function verifyPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  return safeEqual(scryptSync(pin, salt, 32).toString('hex'), hash)
}

export function checkAdminPassword(input: string) {
  const expected = useRuntimeConfig().adminPassword
  if (!expected) return false
  const h = (s: string) => createHash('sha256').update(s).digest('hex')
  return safeEqual(h(input), h(expected))
}

export function setAdminSession(event: H3Event) {
  const exp = Date.now() + ADMIN_TTL_MS
  const payload = `admin.${exp}`
  setCookie(event, ADMIN_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: ADMIN_TTL_MS / 1000,
  })
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, ADMIN_COOKIE, { path: '/' })
}

export function isAdmin(event: H3Event) {
  const raw = getCookie(event, ADMIN_COOKIE)
  if (!raw) return false
  const idx = raw.lastIndexOf('.')
  const payload = raw.slice(0, idx)
  const sig = raw.slice(idx + 1)
  if (!safeEqual(sign(payload), sig)) return false
  const exp = Number(payload.split('.')[1])
  return Number.isFinite(exp) && exp > Date.now()
}

export function requireAdmin(event: H3Event) {
  if (!isAdmin(event)) throw createError({ statusCode: 401, message: 'Authentification requise' })
}

const attempts = new Map<string, { count: number; until: number }>()

/** Returns false once a key has made too many attempts inside the window. */
export function rateLimit(key: string, max = 6, windowMs = 10 * 60_000) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= max
}

export function clientIp(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}
