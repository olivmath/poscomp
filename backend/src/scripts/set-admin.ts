import * as admin from 'firebase-admin'

admin.initializeApp()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx scripts/set-admin.ts <email>')
    process.exit(1)
  }

  const user = await admin.auth().getUserByEmail(email)
  await admin.auth().setCustomUserClaims(user.uid, { admin: true })
  console.log(`✓ Admin claim set for ${email} (${user.uid})`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
