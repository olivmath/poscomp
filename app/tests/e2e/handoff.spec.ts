import { test, expect } from '@playwright/test'
import admin from 'firebase-admin'
import fs from 'fs'

// Serial test to validate the main handoff flows in order
test.describe.skip('Handoff flows validation (deprecated - flows moved to dedicated specs)', () => {
  test('full user flows: simulado -> revisao -> historico -> perfil/premium', async ({ page }) => {
    const timestamp = Date.now()
    const email = `e2e+handoff${timestamp}@local.test`
    const pwd = 'pass1234'

    // 1) Create user (non-premium false) and also create a premium-test user later as needed
    await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=${encodeURIComponent(pwd)}&premium=true`)
    await page.waitForURL('/')

    // attach console / network listeners to help debugging in case functions fail
    page.on('console', (msg) => {
      console.log('[page console]', msg.type(), msg.text())
    })
    page.on('requestfailed', (req) => {
      console.log('[request failed]', req.url(), req.failure()?.errorText)
    })

    // 2) Start quick simulado from Home (try the quick button first, then fallback to config)
    await page.getByRole('button', { name: 'Começar Simulado' }).click()
    await page.waitForURL(/\/simulado\/running|\//)

    // Wait for the running view to load (progress counter appears). If not visible, dump some info and fail gracefully.
    const progressLocator = page.getByText(/\d+\/\d+/).first()
    if (!(await progressLocator.isVisible().catch(() => false))) {
      console.log('Progress locator not visible after navigation; current URL:', page.url())
      // try opening config flow and starting again
      await page.goto('/simulado/config')
      await page.getByRole('button', { name: 'Começar Simulado' }).click()
      await page.waitForURL(/\/simulado\/running|\//)
    }

    await expect(progressLocator).toBeVisible({ timeout: 15000 })
    const progressText = await progressLocator.innerText()
    const total = parseInt(progressText.split('/')[1], 10)

    // Answer all questions: pick option 'A' and mark 'Devia saber' for each
    for (let i = 0; i < total; i++) {
      // Click first option (option buttons contain letter A/B/C etc.)
      const opt = page.locator('button:has-text("A")').first()
      await opt.waitFor({ state: 'visible', timeout: 5000 })
      await opt.click()

      // Click confidence 'Devia saber'
      const conf = page.getByRole('button', { name: 'Devia saber' })
      await conf.click()

      // small wait for transition
      await page.waitForTimeout(150)
    }

    // Confirm finish modal if presented
    const finishConfirm = page.getByRole('button', { name: 'Confirmar' }).first()
    if (await finishConfirm.isVisible()) {
      await finishConfirm.click()
    }

    // Wait for result page
    await page.waitForURL(/\/simulado\/resultado/)
    await expect(page.getByText('Resultado')).toBeVisible()

    // 3) Go to Revisao and attempt a short review session
    await page.goto('/revisao')
    // If paywall shown, this will fail — user is premium so it should allow running or empty
    const paywall = page.getByText('Recurso Premium')
    if (await paywall.isVisible()) {
      test.fail(true, 'Revisao paywall shown unexpectedly for premium user')
    }

    // If there's a running session, answer first card
    const erreiBtn = page.getByRole('button', { name: 'Errei' })
    if (await erreiBtn.isVisible()) {
      await erreiBtn.click()
      // wait for feedback
      await page.waitForTimeout(500)
    }

    // 4) Check Histórico list and open first item
    await page.goto('/historico')
    // If paywall appears here it's unexpected for premium user
    if (await page.getByText('Recurso Premium').isVisible()) {
      test.fail(true, 'Historico paywall shown unexpectedly for premium user')
    }

    // Click first result item if exists
    const resultBtn = page.locator('button').filter({ hasText: '/' }).first()
    if (await resultBtn.count() > 0) {
      await resultBtn.click()
      await page.waitForURL(/\/historico\//)
      await expect(page.getByText('Questões')).toBeVisible()
    }

    // 5) Premium flow (submit request) using a different user (non-premium)
    const emailPremium = `e2e+premium${timestamp}@local.test`
    await page.goto(`/__e2e__/auth?email=${encodeURIComponent(emailPremium)}&pwd=${encodeURIComponent(pwd)}&premium=false`)
    await page.waitForURL('/')
    await page.goto('/perfil')

    // Open premium modal
    await page.getByRole('button', { name: 'Ver planos' }).click()
    // Choose plan (Pro) and continue
    await page.getByRole('button', { name: 'Pro' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Wait for PIX to be shown and then simulate 'Pagamento enviado'
    await page.waitForSelector('img[alt="QR Code PIX"]', { timeout: 5000 })
    await page.getByRole('button', { name: 'Pagamento enviado' }).click()

    // Upload receipt file
    const filePath = 'tests/e2e/assets/receipt.png'
    const input = page.locator('input[type="file"]')
    await input.setInputFiles(filePath)

    // Wait for confirmation step
    await page.waitForText('Pedido enviado!', { timeout: 5000 }).catch(() => {})

    // 6) Simulate admin approval via Firebase Admin SDK: set user as premium in Firestore
    // Initialize admin SDK connecting to emulators
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'poscomp-olivmath' })
    }

    const authUser = await admin.auth().getUserByEmail(emailPremium)
    const uid = authUser.uid
    const db = admin.firestore()

    // Find latest premium request for this user and mark approved + set user doc
    const snaps = await db.collection('premium_requests').where('uid', '==', uid).orderBy('createdAt', 'desc').limit(1).get()
    if (!snaps.empty) {
      const doc = snaps.docs[0]
      await doc.ref.update({ status: 'approved', reviewedAt: admin.firestore.FieldValue.serverTimestamp(), reviewedBy: 'e2e-tests' })
    }

    // Update users doc to premium
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000)
    await db.doc(`users/${uid}`).set({ isPremium: true, planType: 'pro', premiumStatus: 'active', premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt) }, { merge: true })

    // Back to profile page: should reflect premium status
    await page.goto('/perfil')
    await expect(page.getByText('Plano Pro').first()).toBeVisible()

    // 7) Cleanup: optional - delete user data (call delete data flow) — ensure confirm modal shown
    await page.getByRole('button', { name: 'Apagar todos os dados' }).click()
    await page.getByRole('button', { name: /Confirmar|Apagar/ }).first().click({ timeout: 5000 }).catch(() => {})
  })
})
