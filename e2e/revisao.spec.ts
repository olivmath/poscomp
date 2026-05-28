import { test, expect } from '@playwright/test'
import { mockAuthUser } from './helpers/mock-auth'
import type { SrsCardData, QuestionData } from './helpers/mock-auth'

const now = Math.floor(Date.now() / 1000)

const QUESTION: QuestionData = {
  id: 'q-1',
  ano: 2023,
  area: 'Matemática',
  enunciado: 'Questão de teste para revisão E2E',
  alternativas: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D', E: 'Opção E' },
  resposta: 'A',
}

const PENDING_CARD: SrsCardData = {
  questionId: 'q-1',
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
  dueDate: { seconds: now - 60, nanoseconds: 0 }, // 1 min atrás — pendente
  createdAt: { seconds: now - 3600, nanoseconds: 0 },
  lastConfidence: 'should_know',
  studied: false,
  simuladoCorrect: false,
}

// ── 1. Proteção de rota ───────────────────────────────────────────────────────

test.describe('Revisão — proteção de rota', () => {
  // GIVEN usuário não autenticado
  // WHEN navega para /revisao
  // THEN redirecionado para /login pelo ProtectedRoute
  test('/revisao sem auth redireciona para /login', async ({ page }) => {
    await page.goto('/revisao')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })
})

// ── 2. Estado vazio (Bug 2: Firestore consultado sem race condition) ──────────

test.describe('Revisão — estado vazio', () => {
  // GIVEN usuário autenticado sem cards SRS pendentes
  // WHEN navega para /revisao
  // THEN exibe "Tudo em dia!" com botões de navegação
  test('mostra "Tudo em dia!" quando não há cards pendentes', async ({ page }) => {
    await mockAuthUser(page, { srsCards: [], questions: [] })

    await page.goto('/revisao')

    await expect(page.locator('.revisao-container--loading')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.revisao-card--empty')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('.revisao-title')).toContainText('Tudo em dia')
    await expect(page.locator('.revisao-actions md-outlined-button')).toBeVisible()
    await expect(page.locator('.revisao-actions md-filled-button')).toBeVisible()
  })
})

// ── 3. Cards pendentes (Bug 3: dueDate=agora → aparece na fila) ───────────────

test.describe('Revisão — cards pendentes', () => {
  // GIVEN 1 card SRS com dueDate no passado
  // WHEN navega para /revisao
  // THEN exibe o flashcard com progresso "1 / 1" (não empty state)
  test('mostra flashcard quando há card SRS com dueDate no passado', async ({ page }) => {
    await mockAuthUser(page, { srsCards: [PENDING_CARD], questions: [QUESTION] })

    await page.goto('/revisao')

    await expect(page.locator('.revisao-container--loading')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.revisao-card--empty')).not.toBeVisible({ timeout: 8_000 })
    await expect(page.locator('.revisao-flashcard')).toBeVisible()
    await expect(page.locator('.revisao-progress-text')).toContainText('1 / 1')
  })

  // GIVEN 1 card SRS com dueDate no FUTURO (corrige Bug 3 — era addDays(1), agora addDays(0))
  // WHEN navega para /revisao
  // THEN NÃO exibe flashcard — card futuro não está pendente
  test('NÃO mostra card com dueDate no futuro', async ({ page }) => {
    const futureCard: SrsCardData = {
      ...PENDING_CARD,
      dueDate: { seconds: now + 86400, nanoseconds: 0 }, // amanhã
    }

    await mockAuthUser(page, { srsCards: [futureCard], questions: [QUESTION] })

    await page.goto('/revisao')

    await expect(page.locator('.revisao-container--loading')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.revisao-card--empty')).toBeVisible({ timeout: 8_000 })
  })
})

// ── 4. Interação — revelar gabarito ──────────────────────────────────────────

test.describe('Revisão — revelar gabarito', () => {
  // GIVEN 1 card pendente com questão carregada
  // WHEN clica em "Revelar gabarito"
  // THEN gabarito aparece e botões "Estudei" / "Não estudei" ficam visíveis
  test('clicar em "Revelar gabarito" exibe a resposta correta', async ({ page }) => {
    await mockAuthUser(page, { srsCards: [PENDING_CARD], questions: [QUESTION] })

    await page.goto('/revisao')

    await expect(page.locator('.revisao-reveal-btn')).not.toBeDisabled({ timeout: 10_000 })
    await page.locator('.revisao-reveal-btn').click()

    await expect(page.locator('.revisao-gabarito')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('.revisao-gabarito')).toContainText('Gabarito:')
    await expect(page.locator('.revisao-studying-actions')).toBeVisible()
  })
})

// ── 5. Fluxo completo ─────────────────────────────────────────────────────────

test.describe('Revisão — fluxo completo', () => {
  // GIVEN 1 card pendente
  // WHEN usuário revela gabarito e clica "Estudei"
  // THEN tela de conclusão é exibida
  test('completar todos os cards chega à tela de conclusão', async ({ page }) => {
    await mockAuthUser(page, { srsCards: [PENDING_CARD], questions: [QUESTION] })

    await page.goto('/revisao')

    await expect(page.locator('.revisao-reveal-btn')).not.toBeDisabled({ timeout: 10_000 })
    await page.locator('.revisao-reveal-btn').click()
    await expect(page.locator('.revisao-gabarito')).toBeVisible({ timeout: 5_000 })

    await page.locator('.revisao-btn--yes').click()

    await expect(page.locator('.revisao-card--finished')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('.revisao-title')).toContainText('Sessão concluída')
  })

  // GIVEN 1 card pendente
  // WHEN usuário revela gabarito e clica "Não estudei"
  // THEN também conclui (1 único card)
  test('"Não estudei" com 1 card também conclui a sessão', async ({ page }) => {
    await mockAuthUser(page, { srsCards: [PENDING_CARD], questions: [QUESTION] })

    await page.goto('/revisao')

    await expect(page.locator('.revisao-reveal-btn')).not.toBeDisabled({ timeout: 10_000 })
    await page.locator('.revisao-reveal-btn').click()

    await page.locator('.revisao-btn--no').click()

    await expect(page.locator('.revisao-card--finished')).toBeVisible({ timeout: 8_000 })
  })
})
