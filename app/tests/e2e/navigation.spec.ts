import { test, expect } from '@playwright/test'

test('bottom navigation routes', async ({ page }) => {
  const id = Date.now()
  const email = `e2e+nav${id}@local.test`
  const pwd = 'pass1234'

  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=${encodeURIComponent(pwd)}`)
  await page.waitForURL('/')

  const revisaoBtn = page.getByRole('button', { name: 'Revisão' })
  await revisaoBtn.click()
  await expect(revisaoBtn).toHaveAttribute('aria-current', 'page')

  const historicoBtn = page.getByRole('button', { name: 'Histórico' })
  await historicoBtn.click()
  await expect(historicoBtn).toHaveAttribute('aria-current', 'page')

  const perfilBtn = page.getByRole('button', { name: 'Perfil' })
  await perfilBtn.click()
  await expect(page.getByText('Perfil')).toBeVisible()
})
