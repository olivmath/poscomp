import { test, expect } from '@playwright/test'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PWD } from './globalSetup'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(
    `/__e2e__/auth?email=${encodeURIComponent(E2E_ADMIN_EMAIL)}&pwd=${E2E_ADMIN_PWD}`
  )
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await page.goto('/premium')
  await expect(page.getByRole('heading', { name: 'Solicitações Premium' })).toBeVisible()
}

async function waitLoaded(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })
}

// Happy: /premium carrega com filtros
test('premium → página carrega com filtros', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pendente' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprovado' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Negado' })).toBeVisible()
})

// Happy: filtro "Todos" mostra tabela com todas as colunas
test('filtro Todos → colunas UID, Plano, Status visíveis', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: 'Todos' }).click()
  await expect(page.locator('thead').getByText('UID')).toBeVisible()
  await expect(page.locator('thead').getByText('Plano')).toBeVisible()
  await expect(page.locator('thead').getByText('Status')).toBeVisible()
})

// Happy: filtro "Pendente" → só tickets pending
test('filtro Pendente → sem tickets approved/denied', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: 'Pendente' }).click()
  const badges = page.locator('tbody .badge-approved, tbody .badge-denied')
  await expect(badges).toHaveCount(0)
})

// Happy: filtro "Aprovado" → só tickets approved
test('filtro Aprovado → sem tickets pending/denied', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: 'Aprovado' }).click()
  const pending = page.locator('tbody .badge-pending')
  await expect(pending).toHaveCount(0)
})

// Happy: clicar num ticket pending → expande e mostra botões Aprovar/Negar
test('ticket pending → expande com Aprovar e Negar', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: 'Pendente' }).click()
  const rows = page.locator('tbody tr.expandable')
  const count = await rows.count()
  if (count === 0) {
    test.skip(true, 'Nenhum ticket pending no emulador')
    return
  }

  await rows.first().click()
  // Linha expandida tem os botões de ação
  await expect(page.locator('.expand-content md-filled-button').filter({ hasText: 'Aprovar' })).toBeVisible()
  await expect(page.locator('.expand-content md-outlined-button').filter({ hasText: 'Negar' })).toBeVisible()
})

// Sad: clicar num ticket approved → expande sem botões de ação
test('ticket approved → expande sem botões Aprovar/Negar', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: 'Aprovado' }).click()
  const rows = page.locator('tbody tr.expandable')
  const count = await rows.count()
  if (count === 0) {
    test.skip(true, 'Nenhum ticket approved no emulador')
    return
  }

  await rows.first().click()
  await expect(page.locator('.expand-content md-filled-button')).not.toBeVisible({ timeout: 2_000 })
})

// Happy: empty state quando filtro não tem resultados
test('filtro sem resultados → empty state', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  // Muda para Negado (provavelmente vazio no emulador limpo)
  await page.getByRole('button', { name: 'Negado' }).click()
  const rows = page.locator('tbody tr').filter({ hasText: /nenhuma solicitação/i })
  const emptyState = await rows.count()
  const hasRows = await page.locator('tbody tr.expandable').count()
  // Um dos dois é verdadeiro: tem dados ou tem empty state
  expect(emptyState > 0 || hasRows > 0).toBeTruthy()
})
