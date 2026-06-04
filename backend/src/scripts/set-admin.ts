import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Prefer explicit service account (GOOGLE_APPLICATION_CREDENTIALS). Fall back to
// Application Default Credentials, but detect missing quota project and give a
// clear instruction instead of surfacing the raw FirebaseAuthError.
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT

const adcPath = join(homedir(), '.config', 'gcloud', 'application_default_credentials.json')

let credential: any
let usingADCCredentials = false

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
} else {
  if (existsSync(adcPath)) usingADCCredentials = true
  credential = applicationDefault()

  if (usingADCCredentials) {
    try {
      const adcJson = JSON.parse(readFileSync(adcPath, 'utf8'))
      if (!adcJson.quota_project_id) {
        console.error('Application Default Credentials are in use but no quota project is set.')
        console.error('Set it with:')
        console.error(`  gcloud auth application-default set-quota-project ${projectId ?? '<PROJECT_ID>'}`)
        console.error('Or provide a service account key and set GOOGLE_APPLICATION_CREDENTIALS to its path.')
        process.exit(1)
      }
    } catch (e) {
      console.error('Failed to read Application Default Credentials file:', e)
      process.exit(1)
    }
  }
}

initializeApp({ credential, projectId })

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx backend/src/scripts/set-admin.ts <email>')
    process.exit(1)
  }

  try {
    const auth = getAuth()
    const user = await auth.getUserByEmail(email)
    await auth.setCustomUserClaims(user.uid, { admin: true })
    console.log(`✓ Admin claim set for ${email} (${user.uid})`)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
