// Script usado pelo globalSetup dos testes e2e do admin
// Cria o usuário e2e e seta claim admin:true no emulador

import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@local.test'
const PWD = process.env.E2E_ADMIN_PWD ?? 'pass1234'

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID })

const auth = getAuth()

void (async () => {
  const user = await auth
    .createUser({ email: EMAIL, password: PWD })
    .catch((e) => {
      if (e.code === 'auth/email-already-exists') return auth.getUserByEmail(EMAIL)
      throw e
    })

  await auth.setCustomUserClaims(user.uid, { admin: true })
  console.log(`✓ Admin e2e pronto: ${EMAIL} (uid: ${user.uid})`)
})()
