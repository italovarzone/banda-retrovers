import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { db } from '@/lib/firebaseAdmin'
import { isAuthorizedRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function toShowDTO(doc) {
  const data = doc.data()
  return {
    id: doc.id,
    venue: data.venue,
    city: data.city,
    date: data.date, // ISO string
    image: data.image,
    description: data.description,
    link: data.link,
    location: data.location || null,
    postUrl: data.postUrl || null,
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming')

    let q = db.collection('shows').orderBy('dateTs', 'asc')
    if (upcoming) {
      q = q.where('dateTs', '>=', Timestamp.fromDate(new Date()))
    }

    const snap = await q.get()
    const shows = snap.docs.map(toShowDTO)
    return NextResponse.json(shows, { status: 200 })
  } catch (err) {
    console.error('GET /api/shows error', err)
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}

function isAuthorized(request) {
  const payload = isAuthorizedRequest(request)
  return !!payload
}

function validateShow(body) {
  const required = ['venue', 'city', 'date']
  for (const k of required) {
    if (!body[k] || typeof body[k] !== 'string') return `Campo obrigatório: ${k}`
  }
  const d = new Date(body.date)
  if (isNaN(d)) return 'Data inválida (use ISO com timezone)'
  return null
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationError = validateShow(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const dateObj = new Date(body.date)
    const docData = {
      venue: body.venue,
      city: body.city,
      date: body.date, // ISO string
      dateTs: Timestamp.fromDate(dateObj),
      image: body.image || null,
      description: body.description || null,
      link: body.link || null,
      location: body.location || null,
      postUrl: body.postUrl || null,
      createdAt: Timestamp.now(),
    }

    let ref
    if (body.id && typeof body.id === 'string') {
      ref = db.collection('shows').doc(body.id)
      await ref.set(docData, { merge: true })
    } else {
      ref = await db.collection('shows').add(docData)
    }

    const saved = await ref.get()
    return NextResponse.json(toShowDTO(saved), { status: 201 })
  } catch (err) {
    console.error('POST /api/shows error', err)
    return NextResponse.json({ error: 'Failed to create show' }, { status: 500 })
  }
}
