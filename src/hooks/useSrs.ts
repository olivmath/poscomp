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
import { sm2Update, gradeFromResult } from '../utils/sm2'
import type { SrsCard, Grade, SimuladoResult } from '../types'

interface UseSrsReturn {
  pendingCards: SrsCard[]
  totalPending: number
  loading: boolean
  upsertFromResult: (result: SimuladoResult) => Promise<void>
  updateCard: (questionId: string, grade: Grade, studied?: boolean) => Promise<void>
}

export function useSrs(): UseSrsReturn {
  const { user } = useAuth()
  const [pendingCards, setPendingCards] = useState<SrsCard[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    loadPendingCards(user.uid)
  }, [user])

  async function loadPendingCards(uid: string): Promise<void> {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'srs_cards'))
      const now = Timestamp.now()
      const cards = snap.docs
        .map((d) => ({ questionId: d.id, ...d.data() }) as SrsCard)
        .filter((c) => c.dueDate.seconds <= now.seconds)
      setPendingCards(cards)
    } finally {
      setLoading(false)
    }
  }

  const upsertFromResult = useCallback(
    async (result: SimuladoResult): Promise<void> => {
      if (!user) return

      const cardsSnap = await getDocs(collection(db, 'users', user.uid, 'srs_cards'))
      const existingMap = new Map<string, SrsCard>()
      for (const d of cardsSnap.docs) {
        existingMap.set(d.id, { questionId: d.id, ...d.data() } as SrsCard)
      }

      const writes = result.answers.map(async (answer) => {
        const existing = existingMap.get(answer.questionId)
        const needsReview =
          !answer.correct || answer.skipped || answer.confidence === 'unsure'

        if (needsReview) {
          const card = existing ?? buildNewCard(answer.questionId, answer.confidence, answer.correct)
          const grade = gradeFromResult(answer.correct, answer.confidence)
          const updated = sm2Update({ ...card, lastConfidence: answer.confidence }, grade)
          await upsertCard(user.uid, answer.questionId, { ...card, ...updated })
        } else if (existing && answer.correct && answer.confidence === 'certain') {
          // Advance SRS for well-known card
          const updated = sm2Update({ ...existing, lastConfidence: 'certain' }, 5)
          await upsertCard(user.uid, answer.questionId, { ...existing, ...updated })
        }
      })

      await Promise.all(writes)
      await loadPendingCards(user.uid)
    },
    [user]
  )

  const updateCard = useCallback(
    async (questionId: string, grade: Grade, studied?: boolean): Promise<void> => {
      if (!user) return

      const cardsSnap = await getDocs(collection(db, 'users', user.uid, 'srs_cards'))
      const docData = cardsSnap.docs.find((d) => d.id === questionId)
      if (!docData) return

      const card = { questionId, ...docData.data() } as SrsCard
      const updated = sm2Update(card, grade)
      const finalStudied = studied ?? card.studied
      await upsertCard(user.uid, questionId, { ...card, ...updated, studied: finalStudied })
      await loadPendingCards(user.uid)
    },
    [user]
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
