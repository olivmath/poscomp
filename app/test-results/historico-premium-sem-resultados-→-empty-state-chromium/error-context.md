# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: historico.spec.ts >> premium sem resultados → empty state
- Location: tests/e2e/historico.spec.ts:27:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Nenhum simulado ainda').or(getByText('simulados realizados'))
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Nenhum simulado ainda').or(getByText('simulados realizados'))

```

```yaml
- button "Abrir menu": menu
- text: Histórico
- button "Perfil": account_circle
- text: lock
- heading "Recurso Premium" [level=2]
- paragraph: O histórico completo é exclusivo para assinantes.
- button "Ver planos"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Sad: free user → vê paywall em /historico
  4  | test('free user → paywall em /historico', async ({ page }) => {
  5  |   const email = `e2e+hist${Date.now()}@local.test`
  6  |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=false`)
  7  |   await page.waitForURL('/')
  8  | 
  9  |   await page.goto('/historico')
  10 | 
  11 |   await expect(page.getByText('Recurso Premium')).toBeVisible()
  12 |   await expect(page.getByRole('button', { name: 'Ver planos' })).toBeVisible()
  13 | })
  14 | 
  15 | // Sad: paywall → "Ver planos" navega para /perfil
  16 | test('paywall /historico → Ver planos → /perfil', async ({ page }) => {
  17 |   const email = `e2e+hist2${Date.now()}@local.test`
  18 |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=false`)
  19 |   await page.waitForURL('/')
  20 | 
  21 |   await page.goto('/historico')
  22 |   await page.getByRole('button', { name: 'Ver planos' }).click()
  23 |   await page.waitForURL('/perfil')
  24 | })
  25 | 
  26 | // Happy: premium sem resultados → estado empty
  27 | test('premium sem resultados → empty state', async ({ page }) => {
  28 |   const email = `e2e+hist3${Date.now()}@local.test`
  29 |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  30 |   await page.waitForURL('/')
  31 | 
  32 |   await page.goto('/historico')
  33 | 
  34 |   // Aguarda o conteúdo premium aparecer (userDoc pode ter race condition ao carregar)
  35 |   // Espera por "Nenhum simulado ainda" (empty) ou "simulados realizados" (lista)
  36 |   await expect(
  37 |     page.getByText('Nenhum simulado ainda').or(page.getByText('simulados realizados'))
> 38 |   ).toBeVisible({ timeout: 15000 })
     |     ^ Error: expect(locator).toBeVisible() failed
  39 | })
  40 | 
  41 | // Happy: empty state → "Começar Simulado" navega para /
  42 | test('empty state /historico → Começar Simulado → /', async ({ page }) => {
  43 |   const email = `e2e+hist4${Date.now()}@local.test`
  44 |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  45 |   await page.waitForURL('/')
  46 | 
  47 |   await page.goto('/historico')
  48 |   await page.waitForTimeout(3000)
  49 | 
  50 |   const btn = page.getByRole('button', { name: 'Começar Simulado' })
  51 |   if (await btn.isVisible().catch(() => false)) {
  52 |     await btn.click()
  53 |     await page.waitForURL('/')
  54 |     await expect(page.getByRole('button', { name: 'Começar Simulado' })).toBeVisible()
  55 |   }
  56 | })
  57 | 
  58 | // Happy: lista com resultados → click card → /historico/:id → voltar
  59 | test('lista /historico → click card → detalhe → voltar', async ({ page }) => {
  60 |   const email = `e2e+hist5${Date.now()}@local.test`
  61 |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  62 |   await page.waitForURL('/')
  63 | 
  64 |   await page.goto('/historico')
  65 |   await page.waitForTimeout(3000)
  66 | 
  67 |   // Se houver resultados na lista, clica no primeiro
  68 |   const cards = page.locator('[role="button"]').filter({ hasText: /\d+\/\d+/ })
  69 |   if ((await cards.count()) > 0) {
  70 |     await cards.first().click()
  71 |     await page.waitForURL(/\/historico\/.+/)
  72 | 
  73 |     // detalhe mostra cabeçalho "Detalhes do Simulado"
  74 |     await expect(page.getByText('Detalhes do Simulado')).toBeVisible()
  75 | 
  76 |     // botão voltar usa ícone arrow_back
  77 |     const backBtn = page.locator('button:has(.material-symbols-outlined)').first()
  78 |     await backBtn.click()
  79 |     await page.waitForURL('/historico')
  80 |   }
  81 | })
  82 | 
  83 | // Sad: /historico/:id com id inexistente → redireciona de volta para /historico
  84 | test('/historico/:id inexistente → redirect /historico', async ({ page }) => {
  85 |   const email = `e2e+hist6${Date.now()}@local.test`
  86 |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  87 |   await page.waitForURL('/')
  88 | 
  89 |   await page.goto('/historico/id-nao-existe-xyz')
  90 |   // aguarda Firestore retornar "não existe" e redirecionar
  91 |   await page.waitForURL('/historico', { timeout: 10000 })
  92 | })
  93 | 
```