import { NextResponse } from 'next/server'
import { QrCodePix } from 'qrcode-pix'

export const dynamic = 'force-dynamic'

// Normaliza a chave PIX para o formato esperado pelo BACEN DICT
function normalizePixKey(key) {
  key = key.trim()
  // CPF com pontuação: 123.456.789-00 → 12345678900
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(key)) return key.replace(/[.\-]/g, '')
  // Telefone BR sem código de país (10-11 dígitos: DDD + número)
  if (/^\d{10,11}$/.test(key)) return `+55${key}`
  // Telefone BR com 55 mas sem + (12-13 dígitos)
  if (/^55\d{10,11}$/.test(key)) return `+${key}`
  // Telefone com + mas sem 55 (caso raro)
  if (/^\+\d{10,11}$/.test(key)) return `+55${key.slice(1)}`
  // E-mail, chave aleatória (UUID), CPF sem pontuação → usa como está
  return key
}

export async function POST(req) {
  try {
    const { pixKey, amount, name, city } = await req.json()
    if (!pixKey) return NextResponse.json({ error: 'pixKey obrigatório' }, { status: 400 })
    if (!amount || amount <= 0) return NextResponse.json({ error: 'amount inválido' }, { status: 400 })

    const normalizedKey = normalizePixKey(pixKey)

    const pix = QrCodePix({
      version: '01',
      key: normalizedKey,
      name: (name || 'Retrovers').substring(0, 25),
      city: (city || 'Araras').substring(0, 15),
      value: parseFloat(amount.toFixed(2)),
      transactionId: '***',
    })

    const payload = pix.payload()
    return NextResponse.json({ payload, normalizedKey })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
