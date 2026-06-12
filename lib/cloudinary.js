import { v2 as cloudinary } from 'cloudinary'

const FOLDER = 'banda-retrovers/bares'

function configured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}

function cld() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  return cloudinary
}

function toItem(r) {
  const shortName = r.public_id.replace(`${FOLDER}/`, '')
  
  return {
    id: r.public_id,
    name: `${shortName}.${r.format}`,
    src: r.secure_url,
    local: false,
    source: 'cloudinary',
  }
}

export function isConfigured() { return configured() }

export async function uploadImage(name, buffer, mimeType) {
  if (!configured()) throw new Error('Cloudinary não configurado')
  const nameWithoutExt = name.replace(/\.[^.]+$/, '')
  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`
  const result = await cld().uploader.upload(dataUri, {
    folder: FOLDER,
    public_id: nameWithoutExt,
    overwrite: true,
  })

  console.log(result.public_id)
  console.log(result.asset_folder)

  return toItem(result)
}

export async function listImages() {
  const result = await cld().api.resources({
    type: 'upload',
    prefix: 'banda-retrovers/bares/',
    max_results: 100,
  })

  const items = result.resources.map(toItem)

  console.log('Items:', items)

  return items
}

export async function findByName(name) {
  if (!configured()) return null
  const nameWithoutExt = name.replace(/\.[^.]+$/, '')
  const publicId = `${FOLDER}/${nameWithoutExt}`
  try {
    const r = await cld().api.resource(publicId)
    return { url: r.secure_url, ...toItem(r) }
  } catch {
    return null
  }
}

export async function renameImage(oldName, newName) {
  if (!configured()) throw new Error('Cloudinary não configurado')
  const oldId = `${FOLDER}/${oldName.replace(/\.[^.]+$/, '')}`
  const newId = `${FOLDER}/${newName.replace(/\.[^.]+$/, '')}`
  const result = await cld().uploader.rename(oldId, newId, { overwrite: true })
  return toItem(result)
}

export async function replaceImage(name, buffer, mimeType) {
  return uploadImage(name, buffer, mimeType) // upload com overwrite: true já substitui
}

export async function deleteImage(publicId) {
  if (!configured()) throw new Error('Cloudinary não configurado')
  await cld().uploader.destroy(publicId)
}
