import { NextResponse } from 'next/server'
import { findFileInFolderByName, downloadFileBuffer } from '@/lib/googleDrive'
import { isConfigured as cloudinaryConfigured, findByName as cloudinaryFindByName } from '@/lib/cloudinary'
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
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

    // 1. Cloudinary (produção) — redireciona para URL CDN
    if (cloudinaryConfigured()) {
      const item = await cloudinaryFindByName(name)
      if (item?.url) {
        return NextResponse.redirect(item.url, { status: 302 })
      }
    }

    // 2. Local filesystem (desenvolvimento)
    const localPath = path.join(process.cwd(), 'public', 'images', name)
    try {
      const data = await fs.readFile(localPath)
      const ext = name.split('.').pop()?.toLowerCase() || ''
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch { /* não existe local */ }

    // 3. Google Drive (imagens legadas)
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    if (folderId) {
      try {
        const file = await findFileInFolderByName(folderId, name)
        if (file) {
          const { data, mimeType, etag } = await downloadFileBuffer(file.id)
          const headers = new Headers({
            'Content-Type': mimeType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=86400',
          })
          if (etag) headers.set('ETag', etag)
          return new Response(data, { status: 200, headers })
        }
      } catch (err) {
        console.error('by-name Drive fallback error:', err.message)
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('GET /api/images/by-name error', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}
