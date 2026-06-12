import crypto from 'node:crypto'

// ─── timing-safe helpers ──────────────────────────────────────────────────────

function safeEquals(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  // pad to same length to avoid length leak, then compare
  const len = Math.max(bufA.length, bufB.length)
  const padA = Buffer.concat([bufA, Buffer.alloc(len - bufA.length)])
  const padB = Buffer.concat([bufB, Buffer.alloc(len - bufB.length)])
  const equal = crypto.timingSafeEqual(padA, padB)
  return equal && bufA.length === bufB.length
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function sign(data, secret) {
  return base64url(crypto.createHmac('sha256', secret).update(data).digest())
}

export function issueToken(payload = {}, options = {}) {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters')
  const now = Math.floor(Date.now() / 1000)
  const ttl = Number(process.env.JWT_TTL_SECONDS || options.ttlSeconds || 60 * 60 * 8) // 8h default
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = base64url(JSON.stringify({ iat: now, exp: now + ttl, ...payload }))
  const sig    = sign(`${header}.${body}`, secret)
  return `${header}.${body}.${sig}`
}

export function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    const parts = token?.split('.')
    if (!parts || parts.length !== 3) return null
    const [h, p, s] = parts
    const expected = sign(`${h}.${p}`, secret)
    // timing-safe signature check
    if (!safeEquals(s, expected)) return null
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp === 'number' && payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}

// ─── credential check ─────────────────────────────────────────────────────────

export function checkCredentials(username, password) {
  const u = process.env.ADMIN_USERNAME
  const p = process.env.ADMIN_PASSWORD
  if (!u || !p) return false
  return safeEquals(username, u) && safeEquals(password, p)
}

// ─── request authorization ────────────────────────────────────────────────────
// Accepts: admin session cookie OR Bearer JWT OR API_WRITE_TOKEN header

export function isAdmin(request) {
  // 1. HTTP-only session cookie (primary path for admin UI)
  const cookieVal = request.cookies?.get?.('admin_session')?.value
  if (cookieVal && verifyToken(cookieVal)) return true

  // 2. Bearer token in Authorization header (JWT or static API_WRITE_TOKEN)
  const authHeader = request.headers?.get?.('authorization') || ''
  const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : ''
  if (bearer) {
    const apiToken = process.env.API_WRITE_TOKEN
    if (apiToken && safeEquals(bearer, apiToken)) return true
    if (verifyToken(bearer)) return true
  }

  return false
}

// legacy alias used in images/route.js
export const isAuthorizedRequest = isAdmin
