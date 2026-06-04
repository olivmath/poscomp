/**
 * Seed script — insere questões reais do POSCOMP no Firestore
 *
 * Uso (Application Default Credentials):
 *   gcloud auth application-default login
 *   FIREBASE_PROJECT_ID=poscomp-olivmath pnpm seed
 *
 * Ou com Service Account explícito:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   FIREBASE_PROJECT_ID=poscomp-olivmath pnpm seed
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath'

const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : applicationDefault()

initializeApp({ credential, projectId })

const db = getFirestore()

async function seed() {
  const dataDir = join(import.meta.dirname, 'data', 'ok')
  const files = readdirSync(dataDir).filter(file => file.endsWith('.json'))
  
  let totalCount = 0

  for (const file of files) {
    const filePath = join(dataDir, file)
    const questions: Record<string, unknown>[] = JSON.parse(readFileSync(filePath, 'utf-8'))
    
    const batch = db.batch()
    for (const q of questions) {
      const ref = db.collection('questions').doc(String(q.id))
      batch.set(ref, q, { merge: true })
    }
    await batch.commit()
    totalCount += questions.length
    console.log(`✅ Processado ${file}: ${questions.length} questões.`)
  }

  console.log(`🚀 Total de ${totalCount} questões sincronizadas no Firestore (projeto: ${projectId})`)
}

seed().catch((err) => {
  console.error('❌ Seed falhou:', err)
  process.exit(1)
})