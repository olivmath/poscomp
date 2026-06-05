import { test, expect } from '@playwright/test'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PWD } from './globalSetup'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(
    `/__e2e__/auth?email=${encodeURIComponent(E2E_ADMIN_EMAIL)}&pwd=${E2E_ADMIN_PWD}`
  )
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await page.goto('/announcements')
  await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
}

async function waitLoaded(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })
}

// Happy: /announcements carrega com botão "Novo banner"
test('announcements → botão Novo banner visível', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await expect(page.locator('md-filled-button').filter({ hasText: 'Novo banner' })).toBeVisible()
})

// Happy: abrir modal "Novo banner" → formulário com campos
test('Novo banner → abre modal com campos', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.locator('md-filled-button').filter({ hasText: 'Novo banner' }).click()
  await expect(page.getByRole('heading', { name: 'Novo banner' })).toBeVisible()
  await expect(page.getByText('Mensagem (markdown)')).toBeVisible()
  await expect(page.getByText('Tipo')).toBeVisible()
})

// Sad: salvar sem mensagem → erro de validação
test('salvar banner sem mensagem → erro "Mensagem obrigatória"', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.locator('md-filled-button').filter({ hasText: 'Novo banner' }).click()
  await expect(page.getByRole('heading', { name: 'Novo banner' })).toBeVisible()

  // Salva sem preencher mensagem
  await page.locator('md-filled-button').filter({ hasText: 'Salvar' }).click()
  await expect(page.getByText('Mensagem obrigatória')).toBeVisible()
})

// Sad: backdrop click fecha modal
test('backdrop click fecha modal de banner', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.locator('md-filled-button').filter({ hasText: 'Novo banner' }).click()
  await expect(page.getByRole('heading', { name: 'Novo banner' })).toBeVisible()

  await page.mouse.click(10, 10)
  await expect(page.getByRole('heading', { name: 'Novo banner' })).not.toBeVisible({ timeout: 3_000 })
})

// Happy: criar banner → aparece na tabela
test('criar banner → aparece na tabela', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.locator('md-filled-button').filter({ hasText: 'Novo banner' }).click()
  await expect(page.getByRole('heading', { name: 'Novo banner' })).toBeVisible()

  const msg = `Banner E2E ${Date.now()}`
  await page.locator('textarea').fill(msg)

  await page.locator('md-filled-button').filter({ hasText: 'Salvar' }).click()
  await expect(page.getByRole('heading', { name: 'Novo banner' })).not.toBeVisible({ timeout: 10_000 })

  // Banner aparece na tabela
  await expect(page.locator('tbody').getByText(msg.slice(0, 40))).toBeVisible({ timeout: 5_000 })
})

// Happy: editar banner → modal abre com dados preenchidos
test('editar banner → modal com mensagem preenchida', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const count = await page.locator('tbody tr').count()
  if (count === 0) {
    test.skip(true, 'Nenhum banner para editar')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'edit' }).first().click()
  await expect(page.getByRole('heading', { name: 'Editar banner' })).toBeVisible()

  const val = await page.locator('textarea').inputValue()
  expect(val.length).toBeGreaterThan(0)
})

// Happy: deletar banner → diálogo de confirmação
test('deletar banner → diálogo de confirmação', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const count = await page.locator('tbody tr').count()
  if (count === 0) {
    test.skip(true, 'Nenhum banner para deletar')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first().click()
  await expect(page.getByText('Deletar banner')).toBeVisible()
})

// Sad: cancelar deletar banner → permanece na lista
test('cancelar deletar banner → permanece', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const countBefore = await page.locator('tbody tr').count()
  if (countBefore === 0) {
    test.skip(true, 'Nenhum banner')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first().click()
  await expect(page.getByText('Deletar banner')).toBeVisible()

  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByText('Deletar banner')).not.toBeVisible({ timeout: 3_000 })

  const countAfter = await page.locator('tbody tr').count()
  expect(countAfter).toBe(countBefore)
})

// Happy: toggle ativo → switch muda estado
test('toggle ativo/inativo → switch altera estado', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  const count = await page.locator('tbody tr').count()
  if (count === 0) {
    test.skip(true, 'Nenhum banner')
    return
  }

  const switchEl = page.locator('tbody md-switch').first()
  const before = await switchEl.getAttribute('selected')

  await switchEl.click()
  await page.waitForTimeout(1_500) // aguarda CF

  const after = await switchEl.getAttribute('selected')
  // O atributo deve ter mudado
  expect(before).not.toBe(after)
})

// Happy: tipos info/warning/success → radio selecionável
test('novo banner → selecionar tipo warning', async ({ page }) => {
  await loginAdmin(page)
  await waitLoaded(page)

  await page.locator('md-filled-button').filter({ hasText: 'Novo banner' }).click()
  await expect(page.getByRole('heading', { name: 'Novo banner' })).toBeVisible()

  const warningRadio = page.locator('input[type="radio"][value="warning"]')
  await warningRadio.click()
  await expect(warningRadio).toBeChecked()
})
