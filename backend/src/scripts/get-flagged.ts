import * as admin from 'firebase-admin'

admin.initializeApp()

async function main() {
  const db = admin.firestore()
  const snap = await db.collection('flagged_questions').where('resolved', '==', false).get()
  if (snap.empty) {
    console.log('No pending flagged questions.')
    process.exit(0)
  }
  console.log(`\n${snap.size} pending flagged question(s):\n`)
  snap.docs.forEach((d) => {
    const data = d.data()
    console.log(`ID: ${d.id}`)
    console.log(`  questionId: ${data['questionId']}`)
    console.log(`  uid: ${data['uid']}`)
    console.log(`  comment: ${data['comment'] || '(none)'}`)
    console.log(`  createdAt: ${data['createdAt']?.toDate().toISOString()}`)
    console.log()
  })
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
