import { google } from 'googleapis'

let driveClient = null

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY
  if (!email || !key) {
    throw new Error('Google Drive credentials missing: set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  }
  // Handle multiline private keys stored with \n
  if (key.includes('\\n')) key = key.replace(/\\n/g, '\n')
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  })
  return auth
}

export function getDrive() {
  if (driveClient) return driveClient
  const auth = getAuth()
  driveClient = google.drive({ version: 'v3', auth })
  return driveClient
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
