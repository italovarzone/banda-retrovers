import { NextResponse } from 'next/server'
import { issueToken, checkCredentials, isAdmin } from '@/lib/auth'
import { rateLimit, resetRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const COOKIE_NAME  = 'admin_session'
const MAX_AGE      = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 8) // 8h

function buildCookie(value, maxAge) {
  return [
    `${COOKIE_NAME}=${value}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

// GET  /api/auth  → verifica se a sessão está ativa
export async function GET(request) {
  if (isAdmin(request)) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false }, { status: 401 })
}

// POST /api/auth  → login
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

  const rl = rateLimit(`login:${ip}`, 5, 10 * 60 * 1000)
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000)
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterSec / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { username = '', password = '' } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }

    if (!checkCredentials(username, password)) {
      // deliberate delay to further slow brute force even with rate limit
      await new Promise(r => setTimeout(r, 400))
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Success — reset failed-attempt counter
    resetRateLimit(`login:${ip}`)

    const token = issueToken({ sub: 'admin' })
    const res = NextResponse.json({ ok: true }, { status: 200 })
    res.headers.set('Set-Cookie', buildCookie(token, MAX_AGE))
    return res
  } catch (err) {
    console.error('POST /api/auth error', err)
    return NextResponse.json({ error: 'Falha ao autenticar' }, { status: 500 })
  }
}

// DELETE /api/auth  → logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', buildCookie('', 0))
  return res
}
