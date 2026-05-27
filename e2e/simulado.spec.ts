import { test, expect } from '@playwright/test'

test.describe('Simulado — roteamento e proteção', () => {
  test('rota /simulado redireciona para /login sem auth', async ({ page }) => {
    await page.goto('/simulado')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })

  test('app carrega sem erros fatais de JavaScript', async ({ page }) => {
    const fatalErrors: string[] = []
    page.on('pageerror', (e) => {
      // Ignora erros esperados de rede do Firebase (API key fake)
      const msg = e.message
      if (
        msg.includes('auth/') ||
        msg.includes('Firebase') ||
        msg.includes('INVALID_API_KEY') ||
        msg.includes('firestore') ||
        msg.includes('net::ERR')
      ) return
      fatalErrors.push(msg)
    })

    await page.goto('/simulado')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
    expect(fatalErrors).toHaveLength(0)
  })
})

test.describe('Login page — estrutura DOM', () => {
  test('tela de login tem card, título e botão', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('.login-card')).toBeVisible()
    await expect(page.locator('.login-title')).toContainText('Poscomp')
    await expect(page.locator('md-filled-button')).toBeVisible()
  })

  test('não há erros de runtime na tela de login', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => {
      const msg = e.message
      if (msg.includes('Firebase') || msg.includes('INVALID_API_KEY') || msg.includes('net::ERR')) return
      errors.push(msg)
    })

    await page.goto('/login')
    await expect(page.locator('.login-title')).toBeVisible()
    expect(errors).toHaveLength(0)
  })
})
