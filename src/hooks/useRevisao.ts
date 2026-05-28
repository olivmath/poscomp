import { useState, useCallback, useMemo, useEffect } from 'react'
import { isAuthBypassed } from '../utils/bypass'
import { useAuth } from './useAuth'
import { callGetPendingCards, callReviewCard } from './useFunctions'
import type { PendingCardOutput } from './useFunctions'
import type { Question } from '../types'

// Global injetado via page.addInitScript nos testes E2E
declare global {
  interface Window {
    __AUTH_BYPASS__?: boolean
    __QUESTIONS_MOCK__?: Record<string, Question>
  }
}

export type Priority = 'P1' | 'P2' | 'P3'
export type RevisaoState = 'loading' | 'empty' | 'session' | 'finished'

export interface AdaptedCard {
  questionId: string
  priority: Priority
  question: Question
}

export function useRevisao() {
  const { user } = useAuth()
  const [cards, setCards] = useState<PendingCardOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [sessionResults, setSessionResults] = useState<{
    P1: number; P2: number; P3: number
  }>({ P1: 0, P2: 0, P3: 0 })

  // ── Load cards on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    // Bypass de teste: lê __SRS_MOCK__ + __QUESTIONS_MOCK__ injetados pelo helper E2E
    if (isAuthBypassed()) {
      const srsRaw = (window as Record<string, unknown>).__SRS_MOCK__ as Array<{
        questionId: string
        easeFactor: number
        interval: number
        repetitions: number
        dueDate: { seconds: number; nanoseconds: number }
        lastConfidence: string | null
        studied: boolean
        simuladoCorrect: boolean
      }> | undefined

      const questionsMap = (window as Record<string, unknown>).__QUESTIONS_MOCK__ as
        Record<string, import('../types').Question> | undefined

      const now = Math.floor(Date.now() / 1000)

      const mockCards: import('./useFunctions').PendingCardOutput[] = (srsRaw ?? [])
        .filter(c => c.dueDate.seconds <= now)
        .map(c => ({
          questionId: c.questionId,
          priority: 'P1' as const,
          lastConfidence: (c.lastConfidence ?? 'should_know') as import('../types').Confidence,
          dueDate: new Date(c.dueDate.seconds * 1000).toISOString(),
          repetitions: c.repetitions,
          easeFactor: c.easeFactor,
          interval: c.interval,
          question: (questionsMap ?? {})[c.questionId] ?? {
            id: c.questionId,
            ano: 0,
            area: '',
            enunciado: '',
            alternativas: {},
            resposta: 'A',
          },
        }))

      setCards(mockCards)
      setLoading(false)
      return
    }

    async function fetchCards() {
      setLoading(true)
      try {
        console.log('[CF] getPendingCards (revisao) →')
        const { data } = await callGetPendingCards({})
        console.log('[CF] getPendingCards (revisao) ←', data.cards.length, 'cards', data.cards.map(c => c.priority))
        setCards(data.cards)
      } catch (err) {
        console.error('[CF] getPendingCards (revisao) erro:', err)
        setCards([])
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [user])

  // ── sortedCards: backend already sorts P1→P2→P3, dueDate ASC ────────────
  const sortedCards = useMemo(() => cards, [cards])

  // ── Actions ──────────────────────────────────────────────────────────────
  const reveal = useCallback(() => setShowAnswer(true), [])

  const submit = useCallback(async (studied: boolean) => {
    const currentCard = sortedCards[currentIndex]
    if (!currentCard) return

    setSessionResults(prev => ({
      ...prev,
      [currentCard.priority]: prev[currentCard.priority] + 1,
    }))

    console.log('[CF] reviewCard →', { questionId: currentCard.questionId, studied })
    const { data: reviewData } = await callReviewCard({ questionId: currentCard.questionId, studied })
    console.log('[CF] reviewCard ←', { nextDueDays: reviewData.nextDueDays, newInterval: reviewData.newInterval })

    if (currentIndex < sortedCards.length - 1) {
      setCurrentIndex(i => i + 1)
      setShowAnswer(false)
    } else {
      setSessionCompleted(true)
    }
  }, [currentIndex, sortedCards])

  const reset = useCallback(() => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionCompleted(false)
    setSessionResults({ P1: 0, P2: 0, P3: 0 })
  }, [])

  // ── Derived State ────────────────────────────────────────────────────────
  const state: RevisaoState = useMemo(() => {
    if (loading) return 'loading'
    if (sessionCompleted) return 'finished'
    if (cards.length === 0) return 'empty'
    return 'session'
  }, [loading, cards.length, sessionCompleted])

  // Adapt PendingCardOutput to the shape Revisao.tsx expects
  const rawCard = sortedCards[currentIndex]
  const currentCard: AdaptedCard | undefined = rawCard ? adaptCard(rawCard) : undefined

  return {
    state,
    currentCard,
    currentIndex,
    totalCards: sortedCards.length,
    showAnswer,
    sessionResults,
    reveal,
    submit,
    reset,
  }
}

///// AUX FUNCTIONS

function adaptCard(card: PendingCardOutput): AdaptedCard {
  return {
    questionId: card.questionId,
    priority: card.priority,
    question: {
      id: card.question.id,
      ano: card.question.ano,
      area: card.question.area,
      enunciado: card.question.enunciado,
      alternativas: card.question.alternativas,
      resposta: card.question.resposta,
      comentario: card.question.comentario,
    },
  }
}
