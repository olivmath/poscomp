import { useState, useCallback, useMemo, useEffect } from 'react'
import { collection, getDocs, query, where, documentId } from 'firebase/firestore'
import { db } from '../firebase'
import { isAuthBypassed } from '../utils/bypass'
import { useSrs } from './useSrs'
import type { SrsCard, Question, Grade } from '../types'

// Global injetado via page.addInitScript nos testes E2E
declare global {
  interface Window {
    __AUTH_BYPASS__?: boolean
    __QUESTIONS_MOCK__?: Record<string, Question>
  }
}

export type Priority = 'P1' | 'P2' | 'P3'

export interface ExtendedSrsCard extends SrsCard {
  priority: Priority
  question?: Question
}

export type RevisaoState = 'loading' | 'empty' | 'session' | 'finished'

export function useRevisao() {
  const { pendingCards, updateCard, loading: srsLoading } = useSrs()
  const [questions, setQuestions] = useState<Record<string, Question>>({})
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [sessionResults, setSessionResults] = useState<{
    P1: number; P2: number; P3: number
  }>({ P1: 0, P2: 0, P3: 0 })


  // ── Compute Priority ─────────────────────────────────────────────────────
  const sortedCards = useMemo(() => {
    const cardsWithPriority: ExtendedSrsCard[] = pendingCards.map(card => {
      let priority: Priority
      if (card.lastConfidence === 'should_know') priority = 'P1'
      else if (card.lastConfidence === 'studying') priority = 'P2'
      else priority = 'P3'

      return { ...card, priority, question: questions[card.questionId] }
    })

    const priorityOrder: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 }
    return cardsWithPriority.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return a.dueDate.seconds - b.dueDate.seconds
    })
  }, [pendingCards, questions])

  // ── Fetch Questions ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchQuestions() {
      if (pendingCards.length === 0) return

      // Bypass de teste: usa questions injetadas via window.__QUESTIONS_MOCK__
      if (isAuthBypassed() && window.__QUESTIONS_MOCK__) {
        setQuestions(window.__QUESTIONS_MOCK__)
        return
      }

      const missingIds = pendingCards
        .map(c => c.questionId)
        .filter(id => !questions[id])

      if (missingIds.length === 0) return

      setQuestionsLoading(true)
      try {
        // Firestore 'in' query supports max 30 IDs. For more, we'd need chunks.
        // But SRS sessions are usually smaller or can be loaded in batches.
        const q = query(collection(db, 'questions'), where(documentId(), 'in', missingIds.slice(0, 30)))
        const snap = await getDocs(q)
        const newQuestions: Record<string, Question> = { ...questions }
        snap.forEach(doc => {
          newQuestions[doc.id] = { id: doc.id, ...doc.data() } as Question
        })
        setQuestions(newQuestions)
      } catch (err) {
        console.error('Error fetching SRS questions:', err)
      } finally {
        setQuestionsLoading(false)
      }
    }

    fetchQuestions()
  }, [pendingCards, questions])

  // ── Actions ──────────────────────────────────────────────────────────────
  const reveal = useCallback(() => setShowAnswer(true), [])

  const submit = useCallback(async (studied: boolean) => {
    const currentCard = sortedCards[currentIndex]
    if (!currentCard) return

    // Update stats for the finish screen
    setSessionResults(prev => ({
      ...prev,
      [currentCard.priority]: prev[currentCard.priority] + 1
    }))

    const grade: Grade = studied ? 3 : 1
    await updateCard(currentCard.questionId, grade, studied)
    

    if (currentIndex < sortedCards.length - 1) {
      setCurrentIndex(i => i + 1)
      setShowAnswer(false)
    } else {
      setSessionCompleted(true)
    }
  }, [currentIndex, sortedCards, updateCard])

  const reset = useCallback(() => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionCompleted(false)
    setSessionResults({ P1: 0, P2: 0, P3: 0 })
  }, [])

  // ── Derived State ────────────────────────────────────────────────────────
  const state: RevisaoState = useMemo(() => {
    if (srsLoading || (pendingCards.length > 0 && questionsLoading && Object.keys(questions).length === 0)) {
      return 'loading'
    }
    if (sessionCompleted) return 'finished'
    if (pendingCards.length === 0) return 'empty'
    return 'session'
  }, [srsLoading, questionsLoading, pendingCards.length, questions, sessionCompleted])

  return {
    state,
    currentCard: sortedCards[currentIndex],
    currentIndex,
    totalCards: sortedCards.length,
    showAnswer,
    sessionResults,
    reveal,
    submit,
    reset,
  }
}
