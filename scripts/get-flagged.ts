import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath' })
const db = getFirestore()

async function main() {
  const snapshot = await db.collection('flagged_questions').where('resolved', '==', false).get()

  if (snapshot.empty) {
    console.log('Nenhuma questão sinalizada pendente.')
    return
  }

  console.log(`\n${snapshot.size} questão(ões) sinalizada(s) pendente(s):\n`)
  snapshot.docs.forEach((doc, i) => {
    const d = doc.data()
    console.log(`[${i + 1}] ID: ${doc.id}`)
    console.log(`    questionId : ${d.questionId ?? '-'}`)
    console.log(`    uid        : ${d.uid ?? '-'}`)
    console.log(`    comment    : ${d.comment ?? '-'}`)
    console.log(`    resultId   : ${d.resultId ?? '-'}`)
    console.log(`    createdAt  : ${d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt ?? '-'}`)
    console.log()
  })
}

main().catch(err => { console.error(err); process.exit(1) })
