import { test, expect } from '@playwright/test'

// Happy: login via e2e hook → redireciona para /
test('login via e2e hook → home', async ({ page }) => {
  const email = `e2e+login${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234`)
  await page.waitForURL('/')
  await expect(page.getByRole('button', { name: 'Começar Simulado' })).toBeVisible()
})

// Sad: rota protegida sem autenticação → redireciona para /login
test('rota protegida sem auth → redirect /login', async ({ page }) => {
  await page.goto('/historico')
  await page.waitForURL('/login')
  await expect(page.getByRole('button', { name: /Entrar com Google/i })).toBeVisible()
})

// Sad: usuário já autenticado visita /login → redireciona para /
test('usuário autenticado visita /login → redirect /', async ({ page }) => {
  const email = `e2e+login2${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234`)
  await page.waitForURL('/')

  await page.goto('/login')
  await page.waitForURL('/')
  await expect(page.getByRole('button', { name: 'Começar Simulado' })).toBeVisible()
})
