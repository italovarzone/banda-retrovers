import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables')
  }
  // Support escaped newlines in env
  privateKey = privateKey.replace(/\\n/g, '\n')
  return { projectId, clientEmail, privateKey }
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(getCredentials()),
    })

export const db = getFirestore(app)
