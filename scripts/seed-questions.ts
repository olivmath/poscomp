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

import { readFileSync } from 'fs'
import { join } from 'path'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath'

const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : applicationDefault()

initializeApp({ credential, projectId })

const db = getFirestore()

const questionsPath = join(import.meta.dirname, 'data', 'questions.json')
const questions: Record<string, unknown>[] = JSON.parse(readFileSync(questionsPath, 'utf-8'))


async function seed() {
  const batch = db.batch()

  for (const q of questions) {
    const ref = db.collection('questions').doc(String(q.id))
    batch.set(ref, q)
  }

  await batch.commit()
  console.log(`✅ ${questions.length} questões inseridas no Firestore (projeto: ${projectId})`)
}

seed().catch((err) => {
  console.error('❌ Seed falhou:', err)
  process.exit(1)
})
