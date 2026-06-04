import * as admin from 'firebase-admin'

admin.initializeApp()

async function main() {
  const id = process.argv[2]
  if (!id) {
    console.error('Usage: npx tsx scripts/resolve-flagged.ts <id>')
    process.exit(1)
  }
  const db = admin.firestore()
  const ref = db.doc(`flagged_questions/${id}`)
  const snap = await ref.get()
  if (!snap.exists) { console.error('Not found:', id); process.exit(1) }
  await ref.update({ resolved: true, resolvedAt: admin.firestore.FieldValue.serverTimestamp() })
  console.log(`✓ Resolved flagged question ${id}`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
