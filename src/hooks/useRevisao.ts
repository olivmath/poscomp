import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useSnackbar } from '../components/SnackbarProvider'
import { callGetPendingCards, callReviewCard } from './useFunctions'
import type { PendingCardOutput } from './useFunctions'
import type { Question } from '../types'

export type Priority = 'P1' | 'P2' | 'P3'
export type RevisaoState = 'loading' | 'empty' | 'session' | 'finished'

export interface AdaptedCard {
  questionId: number
  priority: Priority
  question: Question
}

export function useRevisao() {
  const { user } = useAuth()
  const { show: showSnackbar } = useSnackbar()
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

    async function fetchCards() {
      setLoading(true)
      try {
        const { data } = await callGetPendingCards({})
        setCards(data.cards)
      } catch (err) {
        showSnackbar('Erro ao carregar cards para revisão', 'error')
        setCards([])
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [user, showSnackbar])

  // ── sortedCards: backend already sorts P1→P2→P3, dueDate ASC ────────────
  const sortedCards = useMemo(() => cards, [cards])

  // ── Actions ──────────────────────────────────────────────────────────────
  const reveal = useCallback(() => setShowAnswer(true), [])
  const hide = useCallback(() => setShowAnswer(false), [])

  const submit = useCallback((studied: boolean, onNextDue?: (days: number) => void) => {
    const currentCard = sortedCards[currentIndex]
    if (!currentCard) return

    setSessionResults(prev => ({
      ...prev,
      [currentCard.priority]: prev[currentCard.priority] + 1,
    }))

    // fire-and-forget — não bloqueia a UX
    callReviewCard({ questionId: currentCard.questionId, studied })
      .then(({ data }) => {
        onNextDue?.(data.nextDueDays)
      })
      .catch(() => { /* silencioso */ })

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
    hide,
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
      card: card.question.card,
    },
  }
}
