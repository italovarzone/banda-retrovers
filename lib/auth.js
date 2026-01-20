import crypto from 'node:crypto'

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64urlJSON(obj) {
  return base64url(JSON.stringify(obj))
}

function sign(data, secret) {
  return base64url(crypto.createHmac('sha256', secret).update(data).digest())
}

export function issueToken(payload = {}, options = {}) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  const now = Math.floor(Date.now() / 1000)
  const ttl = Number(process.env.JWT_TTL_SECONDS || options.ttlSeconds || 60 * 60 * 12) // 12h default
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { iat: now, exp: now + ttl, ...payload }
  const unsigned = `${base64urlJSON(header)}.${base64urlJSON(body)}`
  const signature = sign(unsigned, secret)
  return `${unsigned}.${signature}`
}

export function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [h, p, s] = parts
    const expected = sign(`${h}.${p}`, secret)
    if (s !== expected) return null
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp === 'number' && payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}

export function isAuthorizedRequest(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7) : ''
  if (!token) return null
  const payload = verifyToken(token)
  return payload
}
