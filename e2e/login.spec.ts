import { test, expect } from '@playwright/test'

/**
 * A página /login é pública — não precisa de auth.
 * As rotas protegidas devem redirecionar para /login após o Firebase
 * resolver o estado de auth (onAuthStateChanged → null → Navigate).
 */

test.describe('Página de Login', () => {
  test('exibe logo, título e botão de login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('.login-title')).toHaveText('Poscomp')
    await expect(page.locator('.login-subtitle')).toContainText('sucesso')
    await expect(page.locator('md-filled-button')).toBeVisible()
    await expect(page.locator('md-filled-button')).toContainText('Entrar com Google')
  })
})

test.describe('Redirecionamento de rotas protegidas', () => {
  // Firebase resolve onAuthStateChanged (null) em ~200ms mesmo com config fake
  // Por segurança aguardamos até 8s pelo redirect
  const timeout = 8_000

  for (const route of ['/', '/simulado', '/historico', '/analises', '/perfil']) {
    test(`${route} redireciona para /login sem auth`, async ({ page }) => {
      await page.goto(route)
      // Espera o spinner sumir e o redirect acontecer
      await expect(page).toHaveURL(/\/login/, { timeout })
    })
  }
})
