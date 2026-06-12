import { google } from 'googleapis'
import { Readable } from 'stream'

let driveClient = null

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY
  if (!email || !key) {
    throw new Error('Google Drive credentials missing: set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  }
  if (key.includes('\\n')) key = key.replace(/\\n/g, '\n')
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

export function getDrive() {
  if (driveClient) return driveClient
  driveClient = google.drive({ version: 'v3', auth: getAuth() })
  return driveClient
}

export async function listImagesInFolder(folderId) {
  const drive = getDrive()
  const q = [`'${folderId}' in parents`, `mimeType contains 'image/'`, 'trashed = false'].join(' and ')
  const res = await drive.files.list({ q, fields: 'files(id,name,mimeType)', orderBy: 'name', pageSize: 200 })
  return res.data.files || []
}

export async function uploadImageToFolder(folderId, filename, buffer, mimeType) {
  const drive = getDrive()
  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,name,mimeType',
  })
  return res.data
}

export async function findFileInFolderByName(folderId, filename) {
  const drive = getDrive()
  const q = [
    `'${folderId}' in parents`,
    `name = '${filename.replace(/'/g, "\\'")}'`,
    'trashed = false'
  ].join(' and ')
  const res = await drive.files.list({
    q,
    fields: 'files(id,name,mimeType,md5Checksum)'
  })
  const file = res.data.files?.[0] || null
  return file
}

export async function getFileMeta(fileId) {
  const drive = getDrive()
  const res = await drive.files.get({ fileId, fields: 'id,name,mimeType,md5Checksum' })
  return res.data
}

export async function downloadFileBuffer(fileId) {
  const drive = getDrive()
  const meta = await getFileMeta(fileId)
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
  const data = Buffer.from(res.data)
  return { data, mimeType: meta.mimeType, etag: meta.md5Checksum || undefined, name: meta.name }
}
