import { NextResponse } from 'next/server'
import { downloadFileBuffer } from '@/lib/googleDrive'

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  try {
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const { data, mimeType, etag } = await downloadFileBuffer(id)
    const headers = new Headers({
      'Content-Type': mimeType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable'
    })
    if (etag) headers.set('ETag', etag)
    return new Response(data, { status: 200, headers })
  } catch (err) {
    console.error('GET /api/images/[id] error', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}
