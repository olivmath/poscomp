import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './useAuth'
import { sm2Update } from '../utils/sm2'
import { isAuthBypassed } from '../utils/bypass'
import type { SrsCard, Grade, SimuladoResult } from '../types'

interface UseSrsReturn {
  pendingCards: SrsCard[]
  totalPending: number
  loading: boolean
  upsertFromResult: (result: SimuladoResult) => Promise<void>
  updateCard: (
  questionId: string,
  grade: Grade,
  studied?: boolean
) => Promise<void>
}

// Globals injetados via page.addInitScript nos testes E2E
declare global {
  interface Window {
    __AUTH_BYPASS__?: boolean
    __SRS_MOCK__?: SrsCard[]
  }
}

export function useSrs(): UseSrsReturn {
  const { user } = useAuth()
  const [pendingCards, setPendingCards] = useState<SrsCard[]>([])
  const [loading, setLoading] = useState(false)

  const loadPendingCards = useCallback(async (_uid: string): Promise<void> => {
    // Bypass de teste: usa dados injetados via window.__SRS_MOCK__
    if (isAuthBypassed() && window.__SRS_MOCK__ !== undefined) {
      const now = Timestamp.now()
      setPendingCards(window.__SRS_MOCK__.filter((c) => c.dueDate.seconds <= now.seconds))
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users', _uid, 'srs_cards'))
      const now = Timestamp.now()
      const cards = snap.docs
        .map((d) => ({ questionId: d.id, ...d.data() }) as SrsCard)
        .filter((c) => c.dueDate.seconds <= now.seconds)
      setPendingCards(cards)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadPendingCards(user.uid)
  }, [user, loadPendingCards])

  const upsertFromResult = useCallback(
    async (result: SimuladoResult): Promise<void> => {
      if (!user) return
      if (isAuthBypassed() && window.__SRS_MOCK__ !== undefined) return

      const cardsSnap = await getDocs(collection(db, 'users', user.uid, 'srs_cards'))
      const existingMap = new Map<string, SrsCard>()
      for (const d of cardsSnap.docs) {
        existingMap.set(d.id, { questionId: d.id, ...d.data() } as SrsCard)
      }

      const writes = result.answers.map(async (answer) => {
        const existing = existingMap.get(answer.questionId)
        const needsReview = !answer.correct || answer.confidence !== null
        if (needsReview) {
          const confidence = answer.confidence ?? 'unsure'
          if (existing) {
            // Simulado apenas atualiza confiança e marca como devido agora — o SM-2 avança na revisão (updateCard)
            await upsertCard(user.uid, answer.questionId, {
              ...existing,
              lastConfidence: confidence,
              dueDate: Timestamp.fromDate(new Date()),
            })
          } else {
            const card = buildNewCard(answer.questionId, confidence, answer.correct)
            await upsertCard(user.uid, answer.questionId, card)
          }
        }
      })

      await Promise.all(writes)
      await loadPendingCards(user.uid)
    },
    [user, loadPendingCards]
  )

  const updateCard = useCallback(
    async (questionId: string, grade: Grade, studied?: boolean): Promise<void> => {
      if (!user) return
      if (isAuthBypassed() && window.__SRS_MOCK__ !== undefined) {
        // Em testes E2E com mock, apenas avança o estado local sem Firestore
        setPendingCards(prev => prev.filter(c => c.questionId !== questionId))
        return
      }

      const cardsSnap = await getDocs(collection(db, 'users', user.uid, 'srs_cards'))
      const docData = cardsSnap.docs.find((d) => d.id === questionId)
      if (!docData) return

      const card = { questionId, ...docData.data() } as SrsCard
      const updated = sm2Update(card, grade)
      const finalStudied = studied ?? card.studied
      await upsertCard(user.uid, questionId, { ...card, ...updated, studied: finalStudied })
      await loadPendingCards(user.uid)
    },
    [user, loadPendingCards]
  )

  return {
    pendingCards,
    totalPending: pendingCards.length,
    loading,
    upsertFromResult,
    updateCard,
  }
}

///// AUX FUNCTIONS

function buildNewCard(
  questionId: string,
  confidence: import('../types').Confidence,
  simuladoCorrect: boolean
): SrsCard {
  return {
    questionId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    dueDate: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.now(),
    lastConfidence: confidence,
    studied: false,
    simuladoCorrect,
  }
}

async function upsertCard(
  uid: string,
  questionId: string,
  card: SrsCard
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { questionId: _questionId, ...data } = card
  await setDoc(doc(db, 'users', uid, 'srs_cards', questionId), data, { merge: true })
}
