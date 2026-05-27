import { test, expect } from '@playwright/test'

test.describe('Histórico — roteamento', () => {
  test('rota /historico redireciona para login sem auth', async ({ page }) => {
    await page.goto('/historico')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })

  test('bundle não tem erros fatais ao acessar /historico', async ({ page }) => {
    const fatalErrors: string[] = []
    page.on('pageerror', (e) => {
      const msg = e.message
      if (msg.includes('Firebase') || msg.includes('INVALID_API_KEY') || msg.includes('net::ERR')) return
      fatalErrors.push(msg)
    })

    await page.goto('/historico')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
    expect(fatalErrors).toHaveLength(0)
  })
})
