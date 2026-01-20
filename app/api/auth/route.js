import { NextResponse } from 'next/server'
import { issueToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }

    const u = process.env.ADMIN_USERNAME
    const p = process.env.ADMIN_PASSWORD
    if (!u || !p) {
      return NextResponse.json({ error: 'Credenciais não configuradas' }, { status: 500 })
    }

    if (username !== u || password !== p) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const ttlSeconds = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 12) // 12h
    const token = issueToken({ sub: 'admin' }, { ttlSeconds })
    return NextResponse.json({ token, expiresIn: ttlSeconds }, { status: 200 })
  } catch (err) {
    console.error('POST /api/auth error', err)
    return NextResponse.json({ error: 'Falha ao autenticar' }, { status: 500 })
  }
}
