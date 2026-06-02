import type { Page } from '@playwright/test'

const PROJECT_ID = 'poscomp-test'
const TEST_UID = 'test-uid-123'

/**
 * Injects auth bypass flag into the page before Firebase SDK initializes.
 * Sets window.__AUTH_BYPASS__ = true, which AuthContext reads to skip
 * onAuthStateChanged and return a mock user directly.
 *
 * Must be called BEFORE page.goto() so addInitScript runs before app code.
 */
export async function mockAuthUser(page: Page, {
  srsCards,
  questions,
}: {
  srsCards?: SrsCardData[]
  questions?: QuestionData[]
} = {}) {
  // Inject auth bypass flag — runs before any app JS
  await page.addInitScript(() => {
    window.__AUTH_BYPASS__ = true
  })

  // Prevent Firebase SDK from attempting real token refresh
  await page.route('**/securetoken.googleapis.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access-token',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'fake-refresh-token',
        id_token: 'fake-id-token',
        user_id: TEST_UID,
      }),
    })
  )

  // Prevent identity toolkit calls (getIdToken, etc.)
  await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [{ localId: TEST_UID, email: 'test@poscomp.dev', displayName: 'Test User' }],
      }),
    })
  )

  // Intercept Cloud Function: getPendingCards
  await page.route('**/getPendingCards', (route) => {
    const now = Math.floor(Date.now() / 1000)
    const pending = (srsCards ?? []).filter(c => c.dueDate.seconds <= now)
    const qMap = Object.fromEntries((questions ?? []).map(q => [q.id, q]))

    const cards = pending.map(c => ({
      questionId: c.questionId,
      priority: confidenceToP(c.lastConfidence),
      lastConfidence: c.lastConfidence ?? 'unsure',
      dueDate: new Date(c.dueDate.seconds * 1000).toISOString(),
      repetitions: c.repetitions,
      easeFactor: c.easeFactor,
      interval: c.interval,
      question: qMap[c.questionId] ?? {
        id: c.questionId, ano: 0, area: '', enunciado: '',
        alternativas: {}, resposta: 'A',
      },
    }))

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { cards } }),
    })
  })

  // Intercept Cloud Function: reviewCard
  await page.route('**/reviewCard', (route) => {
    const nextDueDate = new Date(Date.now() + 86400 * 1000).toISOString()
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          nextDueDays: 1,
          nextDueDate,
          newInterval: 1,
          newEaseFactor: 2.5,
          newRepetitions: 0,
        },
      }),
    })
  })
}

function confidenceToP(conf: string | null): 'P1' | 'P2' | 'P3' {
  if (conf === 'should_know') return 'P1'
  if (conf === 'studying') return 'P2'
  return 'P3'
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SrsCardData {
  questionId: string
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: { seconds: number; nanoseconds: number }
  createdAt: { seconds: number; nanoseconds: number }
  lastConfidence: string | null
  studied: boolean
  simuladoCorrect: boolean
}

export interface QuestionData {
  id: string
  ano: number
  area: string
  enunciado: string
  alternativas: Record<string, string>
  resposta: string
  comentario?: string
}

// ── Firestore mock ───────────────────────────────────────────────────────────

/**
 * Intercepts Firestore REST API calls and returns mock data.
 *
 * Handles:
 * - runQuery (POST) for getDocs() → returns matching collection data
 * - PATCH for setDoc/upsertCard → returns 200
 * - :commit (POST) for batch writes → returns 200
 */
export async function mockFirestore(
  page: Page,
  {
    srsCards = [],
    questions = [],
    results = [],
  }: {
    srsCards?: SrsCardData[]
    questions?: QuestionData[]
    results?: unknown[]
  } = {}
) {
  await page.route('**/firestore.googleapis.com/**', (route, request) => {
    const url = request.url()
    const method = request.method()

    // Write operations — just acknowledge
    if (method === 'PATCH' || (method === 'POST' && url.includes(':commit'))) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
      return
    }

    // runQuery — identify collection from structuredQuery in body
    if (method === 'POST' && url.includes(':runQuery')) {
      try {
        const body = JSON.parse(request.postData() ?? '{}')
        const from: Array<{ collectionId: string }> =
          body?.structuredQuery?.from ?? []
        const collectionId = from[0]?.collectionId ?? ''

        if (collectionId === 'srs_cards') {
          const docs = srsCards.map((c) => {
            const { questionId, ...data } = c
            return toFirestoreDoc(`users/${TEST_UID}/srs_cards`, questionId, data as Record<string, unknown>)
          })
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: docs.length > 0
              ? docs.map((d) => JSON.stringify(d)).join('\n')
              : JSON.stringify([{}]),
          })
          return
        }

        if (collectionId === 'questions') {
          // Honor __name__ IN filter if present (fetch by ID)
          const where = body?.structuredQuery?.where
          const requestedIds = extractInIds(where)

          const filtered = requestedIds.length > 0
            ? questions.filter((q) => requestedIds.includes(q.id))
            : questions

          const docs = filtered.map((q) => {
            const { id, ...data } = q
            return toFirestoreDoc('questions', id, data as Record<string, unknown>)
          })
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: docs.length > 0
              ? docs.map((d) => JSON.stringify(d)).join('\n')
              : JSON.stringify([{}]),
          })
          return
        }

        if (collectionId === 'results') {
          const docs = (results as Record<string, unknown>[]).map((r, i) =>
            toFirestoreDoc(`users/${TEST_UID}/results`, `result-${i}`, r)
          )
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: docs.length > 0
              ? docs.map((d) => JSON.stringify(d)).join('\n')
              : JSON.stringify([{}]),
          })
          return
        }
      } catch {
        // Fall through to continue
      }
    }

    // Fallback — empty result
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{}]),
    })
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toFirestoreValue(v: unknown): object {
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (v === null || v === undefined) return { nullValue: 'NULL_VALUE' }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (
    typeof v === 'object' &&
    'seconds' in (v as object) &&
    'nanoseconds' in (v as object)
  ) {
    const ts = v as { seconds: number; nanoseconds: number }
    return { timestampValue: new Date(ts.seconds * 1000).toISOString() }
  }
  if (Array.isArray(v))
    return { arrayValue: { values: v.map(toFirestoreValue) } }
  if (typeof v === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(v as Record<string, unknown>).map(([k, val]) => [
            k,
            toFirestoreValue(val),
          ])
        ),
      },
    }
  }
  return { nullValue: 'NULL_VALUE' }
}

function toFirestoreDoc(
  col: string,
  id: string,
  data: Record<string, unknown>
) {
  return {
    document: {
      name: `projects/${PROJECT_ID}/databases/(default)/documents/${col}/${id}`,
      fields: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, toFirestoreValue(v)])
      ),
      createTime: '2024-01-01T00:00:00Z',
      updateTime: new Date().toISOString(),
    },
    readTime: new Date().toISOString(),
  }
}

/**
 * Extracts IDs from a Firestore structuredQuery `__name__ IN [...]` filter.
 */
function extractInIds(where: unknown): string[] {
  if (!where || typeof where !== 'object') return []
  const w = where as Record<string, unknown>

  // fieldFilter on __name__
  if ('fieldFilter' in w) {
    const ff = w.fieldFilter as Record<string, unknown>
    const field = (ff.field as Record<string, unknown>)?.fieldPath
    if (field === '__name__' && ff.op === 'IN') {
      const values = (ff.value as Record<string, unknown>)?.arrayValue as
        | { values?: Array<{ referenceValue?: string }> }
        | undefined
      return (
        values?.values
          ?.map((v) => v.referenceValue?.split('/').pop() ?? '')
          .filter(Boolean) ?? []
      )
    }
  }

  // compositeFilter — recurse
  if ('compositeFilter' in w) {
    const cf = w.compositeFilter as { filters?: unknown[] }
    return (cf.filters ?? []).flatMap((f) => extractInIds(f))
  }

  return []
}
