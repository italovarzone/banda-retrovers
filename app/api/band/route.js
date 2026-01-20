import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseAdmin'
import { isAuthorizedRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const docRef = () => db.collection('band').doc('main')

const fallback = {
  name: 'Retrôvers',
  about: { paragraphs: [], generations: [] },
  members: [],
  formats: { acoustic: '', electric: '' },
  contact: { whatsapp: '', message: '' },
  playlists: { apple: '' },
}

export async function GET() {
  try {
    const snap = await docRef().get()
    const data = snap.exists ? snap.data() : fallback
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('GET /api/band error', err)
    return NextResponse.json(fallback, { status: 200 })
  }
}

function isAuthorized(request) {
  const payload = isAuthorizedRequest(request)
  return !!payload
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    // Basic shape guard
    const allowed = {
      name: typeof body.name === 'string' ? body.name : undefined,
      about: body.about ? {
        paragraphs: Array.isArray(body.about.paragraphs) ? body.about.paragraphs : undefined,
        generations: Array.isArray(body.about.generations) ? body.about.generations : undefined,
      } : undefined,
      members: Array.isArray(body.members) ? body.members : undefined,
      formats: body.formats ? {
        acoustic: typeof body.formats.acoustic === 'string' ? body.formats.acoustic : undefined,
        electric: typeof body.formats.electric === 'string' ? body.formats.electric : undefined,
      } : undefined,
      contact: body.contact ? {
        whatsapp: typeof body.contact.whatsapp === 'string' ? body.contact.whatsapp : undefined,
        message: typeof body.contact.message === 'string' ? body.contact.message : undefined,
      } : undefined,
      playlists: body.playlists ? {
        apple: typeof body.playlists.apple === 'string' ? body.playlists.apple : undefined,
      } : undefined,
    }
    // Remove undefined keys
    const toSave = {}
    for (const [k,v] of Object.entries(allowed)) {
      if (v !== undefined) toSave[k] = v
    }
    await docRef().set(toSave, { merge: true })
    const saved = await docRef().get()
    return NextResponse.json(saved.data(), { status: 201 })
  } catch (err) {
    console.error('POST /api/band error', err)
    return NextResponse.json({ error: 'Failed to update band' }, { status: 500 })
  }
}
