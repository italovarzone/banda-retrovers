import { NextResponse } from 'next/server'
import { listImagesInFolder, findFileInFolderByName, getDrive } from '@/lib/googleDrive'
import { isAuthorizedRequest } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const IMG_EXT = /\.(png|jpg|jpeg|gif|webp|svg)$/i
const PUBLIC_IMAGES = path.join(process.cwd(), 'public', 'images')

async function listLocalImages() {
  try {
    await fs.mkdir(PUBLIC_IMAGES, { recursive: true })
    const files = await fs.readdir(PUBLIC_IMAGES)
    return files
      .filter(f => IMG_EXT.test(f))
      .map(name => ({ id: null, name, src: `/images/${name}`, local: true }))
  } catch {
    return []
  }
}

// ─── GET: lista local + Drive ─────────────────────────────────────────────────
export async function GET() {
  try {
    const local = await listLocalImages()
    const localNames = new Set(local.map(f => f.name))

    const drive = []
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
      if (folderId) {
        const files = await listImagesInFolder(folderId)
        for (const f of files) {
          if (!localNames.has(f.name)) {
            drive.push({ id: f.id, name: f.name, src: `/api/images/${f.id}`, local: false })
          }
        }
      }
    } catch (err) {
      console.error('GET /api/images Drive error (continuing with local only):', err.message)
    }

    const all = [...local, ...drive].sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json(all)
  } catch (err) {
    console.error('GET /api/images fatal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── POST: upload novo bar ────────────────────────────────────────────────────
export async function POST(request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const formData = await request.formData()
    const name = formData.get('name')
    const file = formData.get('file')

    if (!name?.trim()) return NextResponse.json({ error: 'name obrigatório' }, { status: 400 })
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'file obrigatório' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${name.trim()}.${ext}`
    const bytes = await file.arrayBuffer()
    await fs.mkdir(PUBLIC_IMAGES, { recursive: true })
    await fs.writeFile(path.join(PUBLIC_IMAGES, filename), Buffer.from(bytes))

    return NextResponse.json({ id: null, name: filename, src: `/images/${filename}`, local: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/images error', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

// ─── PUT: editar (renomear / trocar foto) ─────────────────────────────────────
export async function PUT(request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const formData = await request.formData()
    const oldName = formData.get('oldName')   // filename atual ex: "bar do ze.png"
    const newName = formData.get('newName')   // novo nome (sem ext) ex: "Bar do Zé"
    const file    = formData.get('file')      // nova imagem (opcional)

    if (!oldName || !newName?.trim()) {
      return NextResponse.json({ error: 'oldName e newName obrigatórios' }, { status: 400 })
    }

    await fs.mkdir(PUBLIC_IMAGES, { recursive: true })

    const oldExt = oldName.split('.').pop()?.toLowerCase() || 'jpg'
    const newExt = (file && typeof file !== 'string')
      ? file.name.split('.').pop()?.toLowerCase() || oldExt
      : oldExt
    const newFilename = `${newName.trim()}.${newExt}`

    if (file && typeof file !== 'string') {
      const bytes = await file.arrayBuffer()
      await fs.writeFile(path.join(PUBLIC_IMAGES, newFilename), Buffer.from(bytes))
      if (newFilename !== oldName) {
        try { await fs.unlink(path.join(PUBLIC_IMAGES, oldName)) } catch {}
      }
    } else if (newFilename !== oldName) {
      await fs.rename(path.join(PUBLIC_IMAGES, oldName), path.join(PUBLIC_IMAGES, newFilename))
    }

    return NextResponse.json({ id: null, name: newFilename, src: `/images/${newFilename}`, local: true })
  } catch (err) {
    console.error('PUT /api/images error', err)
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 })
  }
}

// ─── DELETE: remover bar ──────────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    if (!isAuthorizedRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const id   = searchParams.get('id')

    if (!name && !id) {
      return NextResponse.json({ error: 'name ou id obrigatório' }, { status: 400 })
    }

    // Local
    if (name) {
      try {
        await fs.unlink(path.join(PUBLIC_IMAGES, name))
        return NextResponse.json({ ok: true })
      } catch (e) {
        if (e.code !== 'ENOENT') throw e
      }
    }

    // Drive (best-effort)
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
      const fileId = id || (folderId && name ? (await findFileInFolderByName(folderId, name))?.id : null)
      if (fileId) {
        await getDrive().files.delete({ fileId, supportsAllDrives: true })
        return NextResponse.json({ ok: true })
      }
    } catch (err) {
      console.error('DELETE Drive error', err)
      return NextResponse.json({ error: 'Arquivo não encontrado ou sem permissão para deletar do Drive' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('DELETE /api/images error', err)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
