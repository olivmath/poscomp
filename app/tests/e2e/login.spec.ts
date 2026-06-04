import { test, expect } from '@playwright/test'

test('login via e2e hook and land on home', async ({ page }) => {
  const id = Date.now()
  const email = `e2e+${id}@local.test`
  const pwd = 'pass1234'

  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=${encodeURIComponent(pwd)}`)
  await page.waitForURL('/')
  await expect(page.getByText('Começar Simulado')).toBeVisible()
})
