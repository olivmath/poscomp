import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath' })
const db = getFirestore()

async function main() {
  const ids = ['alg-01', 'alg-02', 'bd-01', 'bd-02', 'log-01', 'mat-01', 'red-01']
  for (const id of ids) {
    const doc = await db.collection('questions').doc(id).get()
    if (doc.exists) {
      const d = doc.data()!
      console.log(`${id} → campos: ${Object.keys(d).join(', ')} | enunciado: ${String(d.enunciado ?? 'MISSING').slice(0, 60)}`)
    } else {
      console.log(`${id} → NÃO EXISTE`)
    }
  }

  const snap = await db.collection('questions').limit(3).get()
  console.log('\nIDs reais na coleção:', snap.docs.map(d => d.id).join(', '))
  if (snap.docs[0]) {
    const d = snap.docs[0].data()
    console.log('Campos do primeiro:', Object.keys(d).join(', '))
  }
}

main().catch(err => { console.error(err); process.exit(1) })
