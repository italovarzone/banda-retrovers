import { NextResponse } from 'next/server'
import { listImagesInFolder, findFileInFolderByName, getDrive } from '@/lib/googleDrive'
import { isAdmin } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'
import {
  isConfigured as cloudinaryConfigured,
  uploadImage,
  listImages,
  renameImage,
  replaceImage,
  deleteImage,
} from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

const IMG_EXT = /\.(png|jpg|jpeg|gif|webp|svg)$/i
const PUBLIC_IMAGES = path.join(process.cwd(), 'public', 'images')

// ─── local (dev only) ─────────────────────────────────────────────────────────
async function listLocalImages() {
  try {
    await fs.mkdir(PUBLIC_IMAGES, { recursive: true })
    const files = await fs.readdir(PUBLIC_IMAGES)
    return files
      .filter(f => IMG_EXT.test(f))
      .map(name => ({ id: null, name, src: `/images/${name}`, local: true, source: 'local' }))
  } catch {
    return []
  }
}

// ─── GET: lista imagens ───────────────────────────────────────────────────────
export async function GET() {
  try {
    // 1. Cloudinary (prod)
    if (cloudinaryConfigured()) {
      const cloud = await listImages()

      // também busca legados do Drive para não quebrar shows antigos
      const driveItems = []
      try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
        if (folderId) {
          const driveFiles = await listImagesInFolder(folderId)
          const cloudNames = new Set(cloud.map(f => f.name))
          for (const f of driveFiles) {
            if (!cloudNames.has(f.name)) {
              driveItems.push({ id: f.id, name: f.name, src: `/api/images/${f.id}`, local: false, source: 'drive' })
            }
          }
        }
      } catch { /* Drive é melhor esforço */ }

      return NextResponse.json([...cloud, ...driveItems].sort((a, b) => a.name.localeCompare(b.name)))
    }

    // 2. Fallback local + Drive (dev sem Cloudinary)
    const local = await listLocalImages()
    const localNames = new Set(local.map(f => f.name))
    const drive = []
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
      if (folderId) {
        const files = await listImagesInFolder(folderId)
        for (const f of files) {
          if (!localNames.has(f.name)) {
            drive.push({ id: f.id, name: f.name, src: `/api/images/${f.id}`, local: false, source: 'drive' })
          }
        }
      }
    } catch (err) {
      console.error('GET /api/images Drive error:', err.message)
    }

    return NextResponse.json([...local, ...drive].sort((a, b) => a.name.localeCompare(b.name)))
  } catch (err) {
    console.error('GET /api/images fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── POST: upload ─────────────────────────────────────────────────────────────
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const formData = await request.formData()
    const name = formData.get('name')?.trim()
    const file = formData.get('file')
    if (!name) return NextResponse.json({ error: 'name obrigatório' }, { status: 400 })
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'file obrigatório' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || 'image/jpeg'
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${name}.${ext}`

    // Cloudinary disponível → usa em prod e dev
    if (cloudinaryConfigured()) {
      const item = await uploadImage(filename, buffer, mimeType)
      return NextResponse.json(item, { status: 201 })
    }

    // sem Cloudinary → salva local (dev)
    await fs.mkdir(PUBLIC_IMAGES, { recursive: true })
    await fs.writeFile(path.join(PUBLIC_IMAGES, filename), buffer)
    return NextResponse.json({ id: null, name: filename, src: `/images/${filename}`, local: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/images error', err)
    return NextResponse.json({ error: err.message || 'Failed to upload image' }, { status: 500 })
  }
}

// ─── PUT: renomear / trocar foto ──────────────────────────────────────────────
export async function PUT(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const formData = await request.formData()
    const oldName = formData.get('oldName')
    const newName = formData.get('newName')?.trim()
    const file    = formData.get('file')
    if (!oldName || !newName) return NextResponse.json({ error: 'oldName e newName obrigatórios' }, { status: 400 })

    if (cloudinaryConfigured()) {
      if (file && typeof file !== 'string') {
        // nova foto: faz upload com novo nome
        const bytes = await file.arrayBuffer()
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const item = await replaceImage(`${newName}.${ext}`, Buffer.from(bytes), file.type || 'image/jpeg')
        // apaga o antigo se nome mudou
        if (oldName.replace(/\.[^.]+$/, '') !== newName) {
          try { await deleteImage(`banda-retrovers/bares/${oldName.replace(/\.[^.]+$/, '')}`) } catch {}
        }
        return NextResponse.json(item)
      } else {
        // apenas renomear
        const item = await renameImage(oldName, newName)
        return NextResponse.json(item)
      }
    }

    // fallback local
    await fs.mkdir(PUBLIC_IMAGES, { recursive: true })
    const oldExt = oldName.split('.').pop()?.toLowerCase() || 'jpg'
    const newExt = (file && typeof file !== 'string') ? file.name.split('.').pop()?.toLowerCase() || oldExt : oldExt
    const newFilename = `${newName}.${newExt}`
    if (file && typeof file !== 'string') {
      const bytes = await file.arrayBuffer()
      await fs.writeFile(path.join(PUBLIC_IMAGES, newFilename), Buffer.from(bytes))
      if (newFilename !== oldName) { try { await fs.unlink(path.join(PUBLIC_IMAGES, oldName)) } catch {} }
    } else if (newFilename !== oldName) {
      await fs.rename(path.join(PUBLIC_IMAGES, oldName), path.join(PUBLIC_IMAGES, newFilename))
    }
    return NextResponse.json({ id: null, name: newFilename, src: `/images/${newFilename}`, local: true })
  } catch (err) {
    console.error('PUT /api/images error', err)
    return NextResponse.json({ error: err.message || 'Failed to update image' }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const id   = searchParams.get('id')
    if (!name && !id) return NextResponse.json({ error: 'name ou id obrigatório' }, { status: 400 })

    if (cloudinaryConfigured() && name) {
      const publicId = `banda-retrovers/bares/${name.replace(/\.[^.]+$/, '')}`
      try { await deleteImage(publicId) } catch (e) {
        if (!e.message?.includes('not found')) throw e
      }
      return NextResponse.json({ ok: true })
    }

    // local
    if (name) {
      try {
        await fs.unlink(path.join(PUBLIC_IMAGES, name))
        return NextResponse.json({ ok: true })
      } catch (e) { if (e.code !== 'ENOENT') throw e }
    }

    // Drive
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
      const fileId = id || (folderId && name ? (await findFileInFolderByName(folderId, name))?.id : null)
      if (fileId) {
        await getDrive().files.delete({ fileId, supportsAllDrives: true })
        return NextResponse.json({ ok: true })
      }
    } catch (err) {
      return NextResponse.json({ error: 'Erro ao deletar do Drive' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('DELETE /api/images error', err)
    return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: 500 })
  }
}
