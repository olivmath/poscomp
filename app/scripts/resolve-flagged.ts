import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath' })
const db = getFirestore()

async function main() {
  const id = process.argv[2]
  if (!id) {
    console.error('Uso: npx tsx scripts/resolve-flagged.ts <flagId>')
    process.exit(1)
  }

  const ref = db.doc(`flagged_questions/${id}`)
  const doc = await ref.get()

  if (!doc.exists) {
    console.error(`Flag não encontrada: ${id}`)
    process.exit(1)
  }

  await ref.update({ resolved: true, resolvedAt: FieldValue.serverTimestamp() })
  console.log(`Flag ${id} marcada como resolvida.`)
}

main().catch(err => { console.error(err); process.exit(1) })
