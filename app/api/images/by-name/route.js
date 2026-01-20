import { NextResponse } from 'next/server'
import { findFileInFolderByName, downloadFileBuffer } from '@/lib/googleDrive'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    if (!folderId) {
      return NextResponse.json({ error: 'Missing GOOGLE_DRIVE_FOLDER_ID' }, { status: 500 })
    }

    const file = await findFileInFolderByName(folderId, name)
    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data, mimeType, etag } = await downloadFileBuffer(file.id)
    const headers = new Headers({
      'Content-Type': mimeType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable'
    })
    if (etag) headers.set('ETag', etag)
    return new Response(data, { status: 200, headers })
  } catch (err) {
    console.error('GET /api/images/by-name error', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}
