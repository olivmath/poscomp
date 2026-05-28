import { test, expect } from '@playwright/test'

test.describe('Análises — roteamento', () => {
  test('rota /analises redireciona para login sem auth', async ({ page }) => {
    await page.goto('/analises')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })

  test('bundle não tem erros fatais ao acessar /analises', async ({ page }) => {
    const fatalErrors: string[] = []
    page.on('pageerror', (e) => {
      const msg = e.message
      if (msg.includes('Firebase') || msg.includes('INVALID_API_KEY') || msg.includes('net::ERR')) return
      fatalErrors.push(msg)
    })

    await page.goto('/analises')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
    expect(fatalErrors).toHaveLength(0)
  })
})
