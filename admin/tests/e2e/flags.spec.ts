import { test, expect } from '@playwright/test'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PWD } from './globalSetup'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(
    `/__e2e__/auth?email=${encodeURIComponent(E2E_ADMIN_EMAIL)}&pwd=${E2E_ADMIN_PWD}`
  )
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await page.goto('/flags')
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
}

async function waitLoaded(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })
}

// Happy: /flags carrega com filtros Pendentes/Resolvidos
test('flags → filtros Pendentes e Resolvidos visíveis', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await expect(page.getByRole('button', { name: /Pendentes/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Resolvidos/ })).toBeVisible()
})

// Happy: filtro Pendentes → colunas da tabela visíveis
test('filtro Pendentes → tabela com colunas Q#, Comentário', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: /Pendentes/ }).click()
  await expect(page.locator('thead').getByText('Q#')).toBeVisible()
  await expect(page.locator('thead').getByText('Comentário do usuário')).toBeVisible()
})

// Happy: expandir report → mostra UID e comentário completo
test('expandir report → mostra detalhes', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const rows = page.locator('tbody tr.expandable')
  const count = await rows.count()
  if (count === 0) {
    test.skip(true, 'Nenhum report no emulador')
    return
  }

  await rows.first().click()
  await expect(page.locator('.expand-content')).toBeVisible()
  await expect(page.locator('.expand-content').getByText('UID')).toBeVisible()
  await expect(page.locator('.expand-content').getByText('Comentário completo')).toBeVisible()
})

// Happy: marcar resolvido → badge "Resolvido" aparece
test('marcar resolvido → report some de Pendentes', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: /Pendentes/ }).click()
  const rows = page.locator('tbody tr.expandable')
  const countBefore = await rows.count()
  if (countBefore === 0) {
    test.skip(true, 'Nenhum report pendente')
    return
  }

  // Clica no botão check_circle (resolver) sem expandir a linha
  await page.locator('span.material-symbols-outlined').filter({ hasText: 'check_circle' }).first().click()

  // Aguarda CF retornar
  await page.waitForTimeout(2_000)
  const countAfter = await page.locator('tbody tr.expandable').count()
  expect(countAfter).toBe(countBefore - 1)
})

// Happy: deletar report → diálogo de confirmação
test('deletar report → diálogo de confirmação', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const count = await page.locator('tbody tr.expandable').count()
  if (count === 0) {
    test.skip(true, 'Nenhum report')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first().click()
  await expect(page.getByText('Deletar report')).toBeVisible()
})

// Sad: cancelar deletar → report permanece
test('cancelar deletar report → permanece na lista', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const countBefore = await page.locator('tbody tr.expandable').count()
  if (countBefore === 0) {
    test.skip(true, 'Nenhum report')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first().click()
  await expect(page.getByText('Deletar report')).toBeVisible()

  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByText('Deletar report')).not.toBeVisible({ timeout: 3_000 })

  const countAfter = await page.locator('tbody tr.expandable').count()
  expect(countAfter).toBe(countBefore)
})

// Happy: filtro Resolvidos → mostrar apenas resolved
test('filtro Resolvidos → sem botão check_circle nas linhas', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.getByRole('button', { name: /Resolvidos/ }).click()
  // Linhas resolvidas não têm o botão de check
  const checkBtns = page.locator('tbody span.material-symbols-outlined').filter({ hasText: 'check_circle' })
  await expect(checkBtns).toHaveCount(0)
})
