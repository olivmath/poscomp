import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import type {
  Question,
  Option,
  AnswerRecord,
  SimuladoResult,
  SimuladoState,
  Area,
  SimuladoConfig,
} from '../types'

const DEFAULT_CONFIG: SimuladoConfig = {
  areas: [],
  totalQuestions: 10,
  timerMode: 'per-question',
  secondsPerQuestion: 120,
}

const STORAGE_KEY = 'poscomp-simulado-config'

interface UseSimuladoReturn {
  state: SimuladoState
  questions: Question[]
  currentIndex: number
  selectedOption: Option | null
  answers: AnswerRecord[]
  secondsLeft: number
  loading: boolean
  error: string | null
  result: SimuladoResult | null
  lastResult: SimuladoResult | null
  config: SimuladoConfig
  // actions
  goToConfig: () => void
  start: (config: SimuladoConfig) => void
  select: (option: Option) => void
  next: () => void
  retry: () => void
}

export function useSimulado(): UseSimuladoReturn {
  const { user } = useAuth()

  const [state, setState] = useState<SimuladoState>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimuladoResult | null>(null)
  const [lastResult, setLastResult] = useState<SimuladoResult | null>(null)
  const [config, setConfig] = useState<SimuladoConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEFAULT_CONFIG
      }
    }
    return DEFAULT_CONFIG
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answersRef = useRef<AnswerRecord[]>([])

  // ── fetch last result on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    getDocs(collection(db, 'users', user.uid, 'results'))
      .then((snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SimuladoResult[]
        if (docs.length === 0) return
        docs.sort((a, b) =>
          (b.completedAt?.seconds ?? 0) - (a.completedAt?.seconds ?? 0)
        )
        setLastResult(docs[0])
      })
      .catch(() => {/* silently ignore */})
  }, [user])

  // ── helpers ──────────────────────────────────────────────────────────────
  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const finish = useCallback(
    async (finalAnswers: AnswerRecord[], timeSpent: number) => {
      stopTimer()
      if (!user) return

      // build area breakdown
      const breakdown: Partial<Record<Area, { correct: number; total: number }>> = {}
      for (const q of questions) {
        if (!breakdown[q.area]) breakdown[q.area] = { correct: 0, total: 0 }
        breakdown[q.area]!.total += 1
        const ans = finalAnswers.find((a) => a.questionId === q.id)
        if (ans?.correct) breakdown[q.area]!.correct += 1
      }

      const score = finalAnswers.filter((a) => a.correct).length

      const resultData = {
        completedAt: serverTimestamp(),
        score,
        totalQuestions: questions.length,
        timeSpentSeconds: timeSpent,
        areaBreakdown: breakdown as SimuladoResult['areaBreakdown'],
        answers: finalAnswers,
      }

      let savedId = `local-${Date.now()}`
      try {
        const ref = await addDoc(
          collection(db, 'users', user.uid, 'results'),
          resultData
        )
        savedId = ref.id
      } catch {
        // save locally even if Firestore fails
      }

      const fullResult: SimuladoResult = {
        id: savedId,
        ...resultData,
        completedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as SimuladoResult['completedAt'],
      }

      setResult(fullResult)
      setLastResult(fullResult)
      setState('finished')
    },
    [user, questions]
  )

  // ── timer ────────────────────────────────────────────────────────────────
  const startTimer = useCallback(
    (startedAt: number, totalSeconds: number) => {
      // timerRef is captured by closure, but we use the ref value
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        const left = totalSeconds - elapsed

        if (left <= 0) {
          stopTimer()
          // auto-submit with current answers (pad unanswered with null)
          const current = answersRef.current
          const padded = [...current]
          for (const q of questions) {
            if (!padded.find((a) => a.questionId === q.id)) {
              padded.push({ questionId: q.id, selected: null, correct: false })
            }
          }
          setSecondsLeft(0)
          finish(padded, totalSeconds)
        } else {
          setSecondsLeft(left)
        }
      }, 1000)
    },
    [finish, questions]
  )

  // ── actions ──────────────────────────────────────────────────────────────
  const goToConfig = useCallback(() => {
    setState('config')
  }, [])

  const start = useCallback(
    async (newConfig: SimuladoConfig) => {
      setLoading(true)
      setError(null)
      try {
        // persist config
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
        setConfig(newConfig)

        const snap = await getDocs(collection(db, 'questions'))
        if (snap.empty) {
          setError('Nenhuma questão encontrada. Execute o seed primeiro.')
          return
        }
        let all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Question[]

        // filter by area
        if (newConfig.areas.length > 0) {
          all = all.filter((q) => newConfig.areas.includes(q.area))
        }

        if (all.length === 0) {
          setError('Nenhuma questão encontrada para as áreas selecionadas.')
          return
        }

        // resolve totalQuestions
        let total = newConfig.totalQuestions
        if (total === 0 || total > all.length) {
          // 'max' mode or more than available
          total = Math.min(all.length, 40)
        }

        // shuffle & pick
        const shuffled = all.sort(() => Math.random() - 0.5).slice(0, total)

        setQuestions(shuffled)
        setCurrentIndex(0)
        setSelectedOption(null)
        setAnswers([])
        answersRef.current = []

        if (newConfig.timerMode === 'per-question') {
          const totalSeconds = (newConfig.secondsPerQuestion ?? 0) * shuffled.length
          setSecondsLeft(totalSeconds)
          const startedAt = Date.now()
          startTimer(startedAt, totalSeconds)
        } else {
          setSecondsLeft(0)
        }

        setState('running')
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar questões. Verifique sua conexão.')
      } finally {
        setLoading(false)
      }
    },
    [startTimer]
  )

  const select = useCallback((option: Option) => {
    setSelectedOption(option)
  }, [])

  const next = useCallback(() => {
    const current = questions[currentIndex]
    const newAnswer: AnswerRecord = {
      questionId: current.id,
      selected: selectedOption,
      correct: selectedOption === current.correctOption,
    }

    const updated = [
      ...answers.filter((a) => a.questionId !== current.id),
      newAnswer,
    ]
    setAnswers(updated)
    answersRef.current = updated

    const isLast = currentIndex === questions.length - 1
    if (isLast) {
      let timeSpent = 0
      if (config.timerMode === 'per-question') {
        const totalSeconds = (config.secondsPerQuestion ?? 0) * questions.length
        timeSpent = totalSeconds - secondsLeft
      }
      finish(updated, timeSpent)
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
    }
  }, [
    questions,
    currentIndex,
    selectedOption,
    answers,
    secondsLeft,
    finish,
    config,
  ])

  const retry = useCallback(() => {
    stopTimer()
    setState('idle')
    setResult(null)
    setQuestions([])
    setCurrentIndex(0)
    setSelectedOption(null)
    setAnswers([])
    answersRef.current = []
    setSecondsLeft(0)
    setError(null)
  }, [])

  // cleanup on unmount
  useEffect(() => () => stopTimer(), [])

  return {
    state,
    questions,
    currentIndex,
    selectedOption,
    answers,
    secondsLeft,
    loading,
    error,
    result,
    lastResult,
    config,
    goToConfig,
    start,
    select,
    next,
    retry,
  }
}
