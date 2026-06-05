import { test, expect } from '@playwright/test'

async function loginFreePerfil(page: import('@playwright/test').Page) {
  const email = `e2e+prem${Date.now()}@local.test`
  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=false`)
  await page.waitForURL('/')
  await page.goto('/perfil')
  // aguarda userDoc carregar (planLabel sai de "…")
  await page.waitForFunction(
    () => !document.body.innerText.includes('…'),
    { timeout: 8000 }
  ).catch(() => {})
  return email
}

// Seletores únicos por plano (baseados no preço exclusivo de cada botão)
const proBtn = (page: import('@playwright/test').Page) =>
  page.locator('button').filter({ hasText: 'R$10/mês' })
const proMaxBtn = (page: import('@playwright/test').Page) =>
  page.locator('button').filter({ hasText: 'R$5/mês' })

// Happy: perfil free → botão "Ver planos" visível
test('perfil free → Ver planos visível', async ({ page }) => {
  await loginFreePerfil(page)
  await expect(page.getByRole('button', { name: 'Ver planos' })).toBeVisible()
})

// Sad: modal step 1 → "Continuar" desabilitado antes de selecionar plano
test('step 1 → Continuar desabilitado sem plano selecionado', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await expect(page.getByText('Escolha seu plano')).toBeVisible()
  const continuar = page.getByRole('button', { name: 'Continuar' })
  await expect(continuar).toBeDisabled()
})

// Happy: step 1 → selecionar Pro → Continuar habilitado
test('step 1 → selecionar Pro → Continuar habilitado', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await expect(page.getByText('Escolha seu plano')).toBeVisible()
  await proBtn(page).click()
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled()
})

// Happy: step 1 → selecionar Pro MAX → Continuar habilitado
test('step 1 → selecionar Pro MAX → Continuar habilitado', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await expect(page.getByText('Escolha seu plano')).toBeVisible()
  await proMaxBtn(page).click()
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled()
})

// Happy: step 1 → Pro → Continuar → step 2 (benefícios)
test('step 1 → step 2 benefícios', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Benefícios inclusos')).toBeVisible()
  await expect(page.getByText('Revisão espaçada SM-2')).toBeVisible()
})

// Sad: backdrop click no step 1 fecha o modal
test('backdrop click no step 1 fecha o modal', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()
  await expect(page.getByText('Escolha seu plano')).toBeVisible()

  // clica no backdrop (canto superior esquerdo, fora do card do modal)
  await page.mouse.click(10, 10)
  await expect(page.getByText('Escolha seu plano')).not.toBeVisible({ timeout: 3000 })
})

// Sad: backdrop click no step 2 fecha o modal
test('backdrop click no step 2 fecha o modal', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Benefícios inclusos')).toBeVisible()

  await page.mouse.click(10, 10)
  await expect(page.getByText('Benefícios inclusos')).not.toBeVisible({ timeout: 3000 })
})

// Sad: botão fechar (X) no step 1 fecha o modal
test('botão X no step 1 fecha o modal', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await expect(page.getByText('Escolha seu plano')).toBeVisible()
  // O botão X no header do modal tem aria implícito com ícone "close"
  // Localiza o botão dentro do cabeçalho do modal
  await page.locator('button').filter({ has: page.locator('.material-symbols-outlined') }).last().click()
  await expect(page.getByText('Escolha seu plano')).not.toBeVisible({ timeout: 3000 })
})

// Happy: step 2 → step 3 PIX
test('step 2 → step 3 PIX', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Benefícios inclusos')).toBeVisible()

  // Mock CF
  await page.route('**/getPixConfig**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { transactionId: '123', pixQrBase64: 'data:image/png;base64,fake', pixCopyPaste: 'fake' } }),
  }))

  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Pagamento via PIX')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pagamento enviado' })).toBeVisible()
  
  // avança para step 4
  await page.getByRole('button', { name: 'Pagamento enviado' }).click()
  await expect(page.getByText('Enviar comprovante')).toBeVisible()
})

// Happy: step 4 → botão fechar visível → step 5 confirmação
test('step 4 upload → step 5 confirmação', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Mock CFs
  await page.route('**/getPixConfig**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { transactionId: '123', pixQrBase64: 'data:image/png;base64,fake', pixCopyPaste: 'fake' } }),
  }))
  await page.route('**/submitPremiumRequest**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { success: true } }),
  }))

  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pagamento enviado' }).click()
  await expect(page.getByText('Enviar comprovante')).toBeVisible()

  // AGORA o botão fechar (X) deve estar visível no step 4
  const closeBtn = page.locator('button').filter({ has: page.locator('.material-symbols-outlined') }).last()
  await expect(closeBtn).toBeVisible()

  // faz upload do arquivo de comprovante
  const input = page.locator('input[type="file"]')
  await input.setInputFiles('tests/e2e/assets/receipt.png')

  await expect(page.getByText('Pedido enviado!')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Estamos liberando seu acesso!')).toBeVisible()
  
  // step 5: único botão de saída no corpo é "Fechar", mas o X no header também deve estar lá
  await expect(closeBtn).toBeVisible()
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(page.getByText('Pedido enviado!')).not.toBeVisible()
})

// Happy: step 2 → botão Voltar → volta para step 1
test('step 2 → Voltar → step 1', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Benefícios inclusos')).toBeVisible()

  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByText('Escolha seu plano')).toBeVisible()
})

// Happy: step 3 → botão Voltar → volta para step 2
test('step 3 → Voltar → step 2', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Mock CF
  await page.route('**/getPixConfig**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { transactionId: '123', pixQrBase64: 'data:image/png;base64,fake', pixCopyPaste: 'fake' } }),
  }))

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Pagamento via PIX')).toBeVisible()

  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByText('Benefícios inclusos')).toBeVisible()
})

// Sad: step 4 com erro de upload → botões "Tentar novamente" e "Voltar"
test('step 4 erro upload → botões Tentar novamente e Voltar', async ({ page }) => {
  await loginFreePerfil(page)
  await page.getByRole('button', { name: 'Ver planos' }).click()

  await proBtn(page).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Mock CFs
  await page.route('**/getPixConfig**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { transactionId: '123', pixQrBase64: 'data:image/png;base64,fake', pixCopyPaste: 'fake' } }),
  }))
  // intercepta a CF para forçar erro
  await page.route('**/submitPremiumRequest**', (route) => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: { status: 'INTERNAL', message: 'forced error' } }),
  }))

  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Pagamento enviado' }).click()
  await expect(page.getByText('Enviar comprovante')).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles('tests/e2e/assets/receipt.png')
  await expect(page.getByText(/Erro ao enviar comprovante/i)).toBeVisible({ timeout: 10000 })

  // "Tentar novamente" e "Voltar" visíveis
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Voltar' }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Selecionar arquivo' })).not.toBeVisible()

  // Clica em voltar e deve ir para step 3
  await page.getByRole('button', { name: 'Voltar' }).last().click()
  await expect(page.getByText('Pagamento via PIX')).toBeVisible()
})

