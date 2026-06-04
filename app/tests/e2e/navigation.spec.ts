import { test, expect } from '@playwright/test'

test('navigation via menu and profile', async ({ page }) => {
  const id = Date.now()
  const email = `e2e+nav${id}@local.test`
  const pwd = 'pass1234'

  await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=${encodeURIComponent(pwd)}`)
  await page.waitForURL('/')

  // open side menu and navigate to Revisão
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('button', { name: 'Revisão' }).click()
  await page.waitForURL('/revisao')
  await expect(page.getByText('Revisão')).toBeVisible()

  // open menu and go to Histórico
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('button', { name: 'Histórico' }).click()
  await page.waitForURL('/historico')
  await expect(page.getByText('Histórico')).toBeVisible()

  // go to Perfil via top-right button
  await page.getByRole('button', { name: 'Perfil' }).click()
  await page.waitForURL('/perfil')
  await expect(page.getByText('Perfil')).toBeVisible()
})
