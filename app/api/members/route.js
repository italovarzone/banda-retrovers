import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseAdmin'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function toDTO(doc) {
  const d = doc.data()
  return { id: doc.id, name: d.name || '', pixKey: d.pixKey || '', city: d.city || '' }
}

export async function GET() {
  try {
    const snap = await db.collection('members').orderBy('name').get()
    return NextResponse.json(snap.docs.map(toDTO))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    const data = { name: body.name.trim(), pixKey: body.pixKey?.trim() || '', city: body.city?.trim() || '' }
    let ref
    if (body.id) {
      ref = db.collection('members').doc(body.id)
      await ref.set(data, { merge: true })
    } else {
      ref = await db.collection('members').add(data)
    }
    const saved = await ref.get()
    return NextResponse.json(toDTO(saved), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    await db.collection('members').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
