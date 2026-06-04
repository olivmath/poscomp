import { test, expect } from '@playwright/test'

test('open simulado config and start simulado', async ({ page }) => {
  const id = Date.now()
  const email = `e2e+sim${id}@local.test`
  const pwd = 'pass1234'

  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=${encodeURIComponent(pwd)}`)
  await page.waitForURL('/')

  await page.getByRole('button', { name: 'Simulado customizado' }).click()
  await expect(page.getByText('Configurar Simulado')).toBeVisible()

  await page.getByRole('button', { name: 'Começar Simulado' }).click()
  await expect(page).toHaveURL(/\/simulado\/running|\//)
})
