import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const emailOrUid = process.argv[2]
if (!emailOrUid) {
  console.error('Usage: make local set-admin <email|uid>')
  process.exit(1)
}

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath' })

const isEmail = emailOrUid.includes('@')
const user = isEmail
  ? await getAuth().getUserByEmail(emailOrUid)
  : await getAuth().getUser(emailOrUid)

await getAuth().setCustomUserClaims(user.uid, { admin: true })

const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST != null
console.log(`✅ admin:true set for ${user.email} (uid=${user.uid})${isEmulator ? ' [emulator]' : ' [prod]'}`)
process.exit(0)
