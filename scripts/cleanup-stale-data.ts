/**
 * Remove questões com schema antigo (campo `text` em vez de `enunciado`)
 * e todos os srs_cards de todos os usuários (que referenciam IDs do schema antigo).
 *
 * Uso:
 *   FIREBASE_PROJECT_ID=poscomp-olivmath pnpm tsx scripts/cleanup-stale-data.ts
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath' })
const db = getFirestore()

async function main() {
  // 1. Remove questões com schema antigo (têm campo "text", não "enunciado")
  const questionsSnap = await db.collection('questions').get()
  const stale = questionsSnap.docs.filter(d => d.data().text !== undefined)

  if (stale.length > 0) {
    const batch = db.batch()
    stale.forEach(d => batch.delete(d.ref))
    await batch.commit()
    console.log(`🗑  ${stale.length} questões com schema antigo removidas (${stale.map(d => d.id).join(', ')})`)
  } else {
    console.log('✅ Nenhuma questão com schema antigo encontrada')
  }

  // 2. Remove todos os srs_cards de todos os usuários
  const usersSnap = await db.collection('users').get()
  let totalCards = 0

  for (const userDoc of usersSnap.docs) {
    const cardsSnap = await db.collection('users').doc(userDoc.id).collection('srs_cards').get()
    if (cardsSnap.empty) continue
    const batch = db.batch()
    cardsSnap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    console.log(`🗑  user ${userDoc.id}: ${cardsSnap.size} srs_cards removidos`)
    totalCards += cardsSnap.size
  }

  console.log(`\n✅ Limpeza concluída — ${stale.length} questões antigas + ${totalCards} srs_cards removidos`)
  console.log('   Faça um novo simulado para recriar os cards com os IDs corretos.')
}

main().catch(err => { console.error('❌', err); process.exit(1) })
