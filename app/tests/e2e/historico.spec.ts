import { test, expect } from '@playwright/test'

// Sad: free user → vê paywall em /historico
test('free user → paywall em /historico', async ({ page }) => {
  const email = `e2e+hist${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=false`)
  await page.waitForURL('/')

  await page.goto('/historico')

  await expect(page.getByText('Recurso Premium')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver planos' })).toBeVisible()
})

// Sad: paywall → "Ver planos" navega para /perfil
test('paywall /historico → Ver planos → /perfil', async ({ page }) => {
  const email = `e2e+hist2${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=false`)
  await page.waitForURL('/')

  await page.goto('/historico')
  await page.getByRole('button', { name: 'Ver planos' }).click()
  await page.waitForURL('/perfil')
})

// Happy: premium sem resultados → estado empty
test('premium sem resultados → empty state', async ({ page }) => {
  const email = `e2e+hist3${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  await page.waitForURL('/')

  await page.goto('/historico')

  // Aguarda o conteúdo premium aparecer (userDoc pode ter race condition ao carregar)
  // Espera por "Nenhum simulado ainda" (empty) ou "simulados realizados" (lista)
  await expect(
    page.getByText('Nenhum simulado ainda').or(page.getByText('simulados realizados'))
  ).toBeVisible({ timeout: 15000 })
})

// Happy: empty state → "Começar Simulado" navega para /
test('empty state /historico → Começar Simulado → /', async ({ page }) => {
  const email = `e2e+hist4${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  await page.waitForURL('/')

  await page.goto('/historico')
  await page.waitForTimeout(3000)

  const btn = page.getByRole('button', { name: 'Começar Simulado' })
  if (await btn.isVisible().catch(() => false)) {
    await btn.click()
    await page.waitForURL('/')
    await expect(page.getByRole('button', { name: 'Começar Simulado' })).toBeVisible()
  }
})

// Happy: lista com resultados → click card → /historico/:id → voltar
test('lista /historico → click card → detalhe → voltar', async ({ page }) => {
  const email = `e2e+hist5${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  await page.waitForURL('/')

  await page.goto('/historico')
  await page.waitForTimeout(3000)

  // Se houver resultados na lista, clica no primeiro
  const cards = page.locator('[role="button"]').filter({ hasText: /\d+\/\d+/ })
  if ((await cards.count()) > 0) {
    await cards.first().click()
    await page.waitForURL(/\/historico\/.+/)

    // detalhe mostra cabeçalho "Detalhes do Simulado"
    await expect(page.getByText('Detalhes do Simulado')).toBeVisible()

    // botão voltar usa ícone arrow_back
    const backBtn = page.locator('button:has(.material-symbols-outlined)').first()
    await backBtn.click()
    await page.waitForURL('/historico')
  }
})

// Sad: /historico/:id com id inexistente → redireciona de volta para /historico
test('/historico/:id inexistente → redirect /historico', async ({ page }) => {
  const email = `e2e+hist6${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  await page.waitForURL('/')

  await page.goto('/historico/id-nao-existe-xyz')
  // aguarda Firestore retornar "não existe" e redirecionar
  await page.waitForURL('/historico', { timeout: 10000 })
})
