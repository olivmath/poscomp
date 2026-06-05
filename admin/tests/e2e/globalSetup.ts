import { execSync } from 'child_process'
import { resolve } from 'path'

export const E2E_ADMIN_EMAIL = 'e2e-admin@local.test'
export const E2E_ADMIN_PWD = 'pass1234'

const PROJECT_ID = 'poscomp-olivmath'
const REPO_ROOT = resolve(__dirname, '../../..')
const SCRIPT = 'backend/src/scripts/create-e2e-admin.ts'

async function globalSetup() {
  // Mesmo padrão do `make local set-admin`:
  // tsx rodado a partir do repo root com FIREBASE_AUTH_EMULATOR_HOST setado
  execSync(`npx tsx ${SCRIPT}`, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      FIREBASE_PROJECT_ID: PROJECT_ID,
      GOOGLE_CLOUD_PROJECT: PROJECT_ID,
      E2E_ADMIN_EMAIL,
      E2E_ADMIN_PWD,
    },
  })
}

export default globalSetup
