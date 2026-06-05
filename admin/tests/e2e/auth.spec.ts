import { test, expect } from '@playwright/test'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PWD } from './globalSetup'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(
    `/__e2e__/auth?email=${encodeURIComponent(E2E_ADMIN_EMAIL)}&pwd=${E2E_ADMIN_PWD}`
  )
  await page.waitForURL('/dashboard', { timeout: 15_000 })
}

// Happy: admin autenticado → dashboard visível
test('admin autenticado → dashboard', async ({ page }) => {
  await loginAdmin(page)
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})

// Sad: não autenticado → redireciona para /login
test('não autenticado → redirect /login', async ({ page }) => {
  await page.goto('/questoes')
  await page.waitForURL('/login')
  await expect(page.getByText('POSCOMP Admin')).toBeVisible()
})

// Sad: usuário autenticado já na /login → redireciona para /dashboard
test('admin já autenticado visita /login → redirect /dashboard', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/login')
  await page.waitForURL('/dashboard')
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})
