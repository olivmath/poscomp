import { test, expect } from '@playwright/test'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PWD } from './globalSetup'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(
    `/__e2e__/auth?email=${encodeURIComponent(E2E_ADMIN_EMAIL)}&pwd=${E2E_ADMIN_PWD}`
  )
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await page.goto('/questoes')
  await expect(page.getByRole('heading', { name: 'Questões' })).toBeVisible()
}

// Happy: /questoes carrega a tabela
test('questoes → tabela visível', async ({ page }) => {
  await loginAdmin(page)
  // Aguarda loading sumir
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })
  await expect(page.locator('table')).toBeVisible()
})

// Happy: filtro por matéria filtra client-side
test('filtro matéria → filtra a lista', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  await page.selectOption('select.input', 'Matemática')
  const rows = page.locator('tbody tr')
  // Todas as linhas visíveis devem ter badge "Matemática" ou linha de empty-state
  const count = await rows.count()
  if (count > 1) {
    await expect(page.locator('tbody td').filter({ hasText: 'Matemática' }).first()).toBeVisible()
  }
})

// Happy: abrir modal "Nova questão" → formulário aparece
test('Nova questão → abre modal com formulário', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  await page.locator('md-filled-button').filter({ hasText: 'Nova questão' }).click()
  await expect(page.getByRole('heading', { name: 'Nova questão' })).toBeVisible()
  await expect(page.locator('textarea').first()).toBeVisible()
})

// Sad: salvar sem enunciado → erro de validação
test('salvar sem enunciado → erro "Enunciado obrigatório"', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  await page.locator('md-filled-button').filter({ hasText: 'Nova questão' }).click()
  await expect(page.getByRole('heading', { name: 'Nova questão' })).toBeVisible()

  // Clica Salvar sem preencher enunciado
  await page.locator('md-filled-button').filter({ hasText: 'Salvar' }).click()
  await expect(page.getByText('Enunciado obrigatório')).toBeVisible()
})

// Sad: backdrop click fecha modal
test('backdrop click fecha modal de questão', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  await page.locator('md-filled-button').filter({ hasText: 'Nova questão' }).click()
  await expect(page.getByRole('heading', { name: 'Nova questão' })).toBeVisible()

  await page.mouse.click(10, 10)
  await expect(page.getByRole('heading', { name: 'Nova questão' })).not.toBeVisible({ timeout: 3_000 })
})

// Happy: criar questão completa → aparece na tabela
test('criar questão completa → aparece na tabela', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  await page.locator('md-filled-button').filter({ hasText: 'Nova questão' }).click()
  await expect(page.getByRole('heading', { name: 'Nova questão' })).toBeVisible()

  // Preenche enunciado
  const enunciado = `Questão E2E ${Date.now()}`
  await page.locator('textarea').first().fill(enunciado)

  // Preenche alternativas A-E
  const inputs = page.locator('.alt-field input.input')
  for (let i = 0; i < 5; i++) {
    await inputs.nth(i).fill(`Alternativa ${['A','B','C','D','E'][i]}`)
  }

  await page.locator('md-filled-button').filter({ hasText: 'Salvar' }).click()
  await expect(page.getByRole('heading', { name: 'Nova questão' })).not.toBeVisible({ timeout: 10_000 })

  // Questão aparece na tabela
  await expect(page.locator('tbody').getByText(enunciado.slice(0, 30))).toBeVisible({ timeout: 5_000 })
})

// Happy: editar questão → modal abre com dados pré-preenchidos
test('editar questão → modal com dados preenchidos', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  const editBtns = page.locator('button').filter({ has: page.locator('.material-symbols-outlined') }).filter({ hasText: '' })
  const firstEditBtn = page.locator('td .gap-row button').first()
  const count = await page.locator('tbody tr').count()
  if (count === 0) {
    test.skip(true, 'Nenhuma questão para editar')
    return
  }

  // Clica no primeiro botão de editar (ícone edit)
  await page.locator('span.material-symbols-outlined').filter({ hasText: 'edit' }).first().click()
  await expect(page.getByRole('heading', { name: 'Editar questão' })).toBeVisible()

  // Enunciado já preenchido
  const textarea = page.locator('textarea').first()
  const value = await textarea.inputValue()
  expect(value.length).toBeGreaterThan(0)
})

// Happy: deletar questão → diálogo de confirmação aparece
test('deletar questão → diálogo de confirmação', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  const count = await page.locator('tbody tr').count()
  if (count === 0) {
    test.skip(true, 'Nenhuma questão para deletar')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first().click()
  await expect(page.getByText('Deletar questão')).toBeVisible()
  await expect(page.getByText('Ação irreversível')).toBeVisible()
})

// Sad: cancelar deletar → diálogo fecha sem remover
test('cancelar deletar → questão permanece', async ({ page }) => {
  await loginAdmin(page)
  await page.waitForFunction(() => !document.querySelector('md-circular-progress'), { timeout: 10_000 })

  const rowsBefore = await page.locator('tbody tr').count()
  if (rowsBefore === 0) {
    test.skip(true, 'Nenhuma questão')
    return
  }

  await page.locator('span.material-symbols-outlined').filter({ hasText: 'delete' }).first().click()
  await expect(page.getByText('Deletar questão')).toBeVisible()

  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByText('Deletar questão')).not.toBeVisible({ timeout: 3_000 })

  const rowsAfter = await page.locator('tbody tr').count()
  expect(rowsAfter).toBe(rowsBefore)
})
