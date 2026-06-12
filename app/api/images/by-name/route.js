import { NextResponse } from 'next/server'
import { findFileInFolderByName, downloadFileBuffer } from '@/lib/googleDrive'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }

    // 1) Checar arquivo local em public/images/ primeiro
    const localPath = path.join(process.cwd(), 'public', 'images', name)
    try {
      const data = await fs.readFile(localPath)
      const ext = name.split('.').pop()?.toLowerCase() || ''
      const headers = new Headers({
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400, immutable',
      })
      return new Response(data, { status: 200, headers })
    } catch {
      // não existe localmente, tenta Drive
    }

    // 2) Buscar no Google Drive
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
      'Cache-Control': 'public, max-age=86400, immutable',
    })
    if (etag) headers.set('ETag', etag)
    return new Response(data, { status: 200, headers })
  } catch (err) {
    console.error('GET /api/images/by-name error', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}
