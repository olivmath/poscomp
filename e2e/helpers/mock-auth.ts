import type { Page } from '@playwright/test'

/**
 * Injeta um mock do Firebase Auth no browser para simular usuário autenticado.
 * Deve ser chamado antes de navegar para qualquer rota protegida.
 */
export async function mockAuthUser(page: Page) {
  // Intercepta as chamadas de rede do Firebase Identity Toolkit
  await page.route('**/identitytoolkit.googleapis.com/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [{ localId: 'test-uid-123', email: 'test@poscomp.dev', displayName: 'Test User' }],
      }),
    })
  })

  // Injeta o estado de auth no IndexedDB que o Firebase SDK usa
  await page.addInitScript(() => {
    // Mock do onAuthStateChanged via localStorage sentinel
    window.__FIREBASE_AUTH_MOCK__ = {
      uid: 'test-uid-123',
      email: 'test@poscomp.dev',
      displayName: 'Test User',
      photoURL: null,
    }
  })
}

/**
 * Intercepta chamadas do Firestore e retorna dados mock.
 */
export async function mockFirestore(page: Page, {
  questions = defaultQuestions,
  results = [],
}: {
  questions?: unknown[]
  results?: unknown[]
} = {}) {
  await page.route('**/firestore.googleapis.com/**', (route, request) => {
    const url = request.url()

    if (url.includes('/questions')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documents: questions.map(toFirestoreDoc) }),
      })
      return
    }

    if (url.includes('/results')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documents: results.map(toFirestoreDoc) }),
      })
      return
    }

    route.continue()
  })
}

function toFirestoreDoc(data: unknown) {
  return {
    name: 'projects/poscomp/databases/(default)/documents/test/doc',
    fields: data,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
  }
}

export const defaultQuestions = Array.from({ length: 10 }, (_, i) => ({
  id: `q-${i + 1}`,
  text: `Questão ${i + 1}: Qual é a resposta correta?`,
  options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D', E: 'Opção E' },
  correctOption: 'A',
  area: ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes'][i % 5],
  difficulty: 'fácil',
}))
