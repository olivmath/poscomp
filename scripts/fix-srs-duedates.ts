/**
 * Reseta dueDate de todos os srs_cards com dueDate futuro para agora.
 *
 * Uso:
 *   gcloud auth application-default login
 *   FIREBASE_PROJECT_ID=poscomp-olivmath pnpm tsx scripts/fix-srs-duedates.ts
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath'

initializeApp({ credential: applicationDefault(), projectId })

const db = getFirestore()

async function fixDueDates() {
  const now = Timestamp.now()
  const usersSnap = await db.collection('users').get()

  let total = 0
  for (const userDoc of usersSnap.docs) {
    const cardsSnap = await db.collection('users').doc(userDoc.id).collection('srs_cards').get()
    const batch = db.batch()
    let count = 0

    for (const cardDoc of cardsSnap.docs) {
      const dueDate = cardDoc.data().dueDate as Timestamp
      if (dueDate && dueDate.seconds > now.seconds) {
        batch.update(cardDoc.ref, { dueDate: now })
        count++
      }
    }

    if (count > 0) {
      await batch.commit()
      console.log(`  user ${userDoc.id}: ${count} cards resetados`)
      total += count
    }
  }

  console.log(`\n✅ ${total} srs_cards com dueDate futuro resetados para agora`)
}

fixDueDates().catch((err) => {
  console.error('❌ Falhou:', err)
  process.exit(1)
})
