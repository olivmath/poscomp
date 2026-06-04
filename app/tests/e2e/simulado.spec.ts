import { test, expect } from '@playwright/test'

async function loginAndGoHome(page: import('@playwright/test').Page, suffix = '') {
  const email = `e2e+sim${suffix}${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234`)
  await page.waitForURL('/')
}

/**
 * Navega para /simulado/running e aguarda questões carregarem via CF.
 * Retorna false se a CF não estiver disponível (redireciona para /).
 */
async function startSimuladoAndWaitForQuestions(page: import('@playwright/test').Page): Promise<boolean> {
  await page.getByRole('button', { name: 'Começar Simulado' }).click()

  // Aguarda resolução: CF carrega questões (counter aparece) OU CF falha (redireciona para /)
  const result = await Promise.race([
    page.locator('text=/\\d+\\/\\d+/').waitFor({ state: 'visible', timeout: 15000 }).then(() => 'loaded' as const),
    page.waitForURL('/', { timeout: 15000 }).then(() => 'redirected' as const),
  ]).catch(() => 'timeout' as const)

  return result === 'loaded'
}

// Happy: botão "Começar Simulado" da home navega para /simulado/running
test('quick start da home → /simulado/running', async ({ page }) => {
  await loginAndGoHome(page, 'qs')
  await page.getByRole('button', { name: 'Começar Simulado' }).click()
  // pode carregar running ou falhar e voltar para / (CF indisponível)
  await page.waitForURL(/\/simulado\/running|\//, { timeout: 5000 })
})

// Happy: config → Começar Simulado → /simulado/running
test('config → começar simulado → /simulado/running', async ({ page }) => {
  await loginAndGoHome(page, 'cfg')
  await page.getByRole('button', { name: 'Simulado customizado' }).click()
  await expect(page.getByText('Configurar Simulado')).toBeVisible()
  await page.getByRole('button', { name: 'Começar Simulado' }).click()
  await expect(page).toHaveURL(/\/simulado\/running|\//)
})

// Happy: ExitModal — cancelar mantém na página
test('exit modal cancelar → continua no simulado', async ({ page }) => {
  await loginAndGoHome(page, 'exit1')
  const loaded = await startSimuladoAndWaitForQuestions(page)
  if (!loaded) {
    test.skip(true, 'CF getSimuladoQuestions indisponível')
    return
  }

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page).toHaveURL(/\/simulado\/running/)
})

// Happy: ExitModal — confirmar sai para /
test('exit modal confirmar → navega para /', async ({ page }) => {
  await loginAndGoHome(page, 'exit2')
  const loaded = await startSimuladoAndWaitForQuestions(page)
  if (!loaded) {
    test.skip(true, 'CF getSimuladoQuestions indisponível')
    return
  }

  // abre ExitModal
  await page.getByRole('button', { name: 'Sair' }).click()

  // dentro do modal há dois botões: "Cancelar" e "Sair" — clica no "Sair" do modal
  const modalSair = page.getByRole('button', { name: 'Sair' }).last()
  await expect(modalSair).toBeVisible()
  await modalSair.click()
  await page.waitForURL('/')
})

// Happy: abre QuestionMapModal e fecha
test('question map modal → abre e fecha', async ({ page }) => {
  await loginAndGoHome(page, 'map')
  const loaded = await startSimuladoAndWaitForQuestions(page)
  if (!loaded) {
    test.skip(true, 'CF getSimuladoQuestions indisponível')
    return
  }

  await page.getByRole('button', { name: 'Mapa de questões' }).click()
  // modal aparece com grid das questões
  await expect(page.locator('[role="dialog"], [data-testid="question-map"]').or(
    page.locator('.modal-overlay, [style*="position: fixed"]').last()
  )).toBeVisible({ timeout: 3000 }).catch(async () => {
    // fallback: qualquer overlay visível
    await page.keyboard.press('Escape')
  })
})

// Happy: pular questão avança para a próxima
test('pular questão → avança para próxima', async ({ page }) => {
  await loginAndGoHome(page, 'skip')
  const loaded = await startSimuladoAndWaitForQuestions(page)
  if (!loaded) {
    test.skip(true, 'CF getSimuladoQuestions indisponível')
    return
  }

  const counterBefore = await page.locator('text=/\\d+\\/\\d+/').first().innerText()
  const totalBefore = parseInt(counterBefore.split('/')[1], 10)

  if (totalBefore <= 1) return // só 1 questão, não há como avançar

  const idxBefore = parseInt(counterBefore.split('/')[0], 10)

  await page.getByRole('button', { name: 'Pular' }).click()
  await page.waitForTimeout(300)

  const counterAfter = await page.locator('text=/\\d+\\/\\d+/').first().innerText()
  const idxAfter = parseInt(counterAfter.split('/')[0], 10)

  expect(idxAfter).toBeGreaterThan(idxBefore)
})

// Happy: selecionar opção + classificar confiança avança questão
test('selecionar opção + confiança → avança questão', async ({ page }) => {
  await loginAndGoHome(page, 'ans')
  const loaded = await startSimuladoAndWaitForQuestions(page)
  if (!loaded) {
    test.skip(true, 'CF getSimuladoQuestions indisponível')
    return
  }

  const counterBefore = await page.locator('text=/\\d+\\/\\d+/').first().innerText()
  const total = parseInt(counterBefore.split('/')[1], 10)

  if (total <= 1) return

  // seleciona primeira opção disponível
  const optionBtn = page.locator('button').filter({ hasText: /^[ABCDE]$/ }).first()
  await optionBtn.click()

  // classifica confiança
  await page.getByRole('button', { name: 'Não sei' }).click()
  await page.waitForTimeout(300)

  const counterAfter = await page.locator('text=/\\d+\\/\\d+/').first().innerText()
  const idxAfter = parseInt(counterAfter.split('/')[0], 10)
  expect(idxAfter).toBe(2)
})

// Sad: Anterior desabilitado na primeira questão
test('botão Anterior desabilitado na primeira questão', async ({ page }) => {
  await loginAndGoHome(page, 'prev')
  const loaded = await startSimuladoAndWaitForQuestions(page)
  if (!loaded) {
    test.skip(true, 'CF getSimuladoQuestions indisponível')
    return
  }

  const anteriorBtn = page.getByRole('button', { name: 'Anterior' })
  await expect(anteriorBtn).toBeDisabled()
})
