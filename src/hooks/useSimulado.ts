import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSnackbar } from '../components/SnackbarProvider'
import { callGetSimuladoQuestions, callFinishSimulado, callReportQuestion } from './useFunctions'
import type {
  Question,
  Option,
  AnswerRecord,
  SimuladoResult,
  SimuladoState,
  Area,
  SimuladoConfig,
  Confidence,
  QuestionStatus,
} from '../types'
import type { FinishSimuladoOutput } from './useFunctions'

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
  loadingFinish: boolean
  error: string | null
  result: SimuladoResult | null
  lastResult: SimuladoResult | null
  config: SimuladoConfig
  questionStatuses: QuestionStatus[]
  // actions
  goToConfig: () => void
  start: (config: SimuladoConfig) => void
  select: (option: Option) => void
  next: (confidence: Confidence, issue?: { comment?: string }) => void
  skip: () => void
  goToQuestion: (index: number) => void
  retry: () => void
}

export function useSimulado(): UseSimuladoReturn {
  const { user } = useAuth()
  const { show: showSnackbar } = useSnackbar()

  const [state, setState] = useState<SimuladoState>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingFinish, setLoadingFinish] = useState(false)
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

  // ── computed ─────────────────────────────────────────────────────────────
  const questionStatuses: QuestionStatus[] = useMemo(() =>
    questions.map((q) => {
      const answer = answers.find((a) => a.questionId === q.id)
      if (!answer) return 'unvisited'
      if (answer.skipped) return 'skipped'
      if (answer.confidence === 'unsure') return 'unsure'
      if (answer.confidence === 'studying') return 'studying'
      if (answer.confidence === 'should_know') return 'should_know'
      return 'unvisited'
    })
  , [questions, answers])

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
      setLoadingFinish(true)

      // Filter out skipped/unanswered — backend only accepts answered questions
      const answeredInputs = finalAnswers
        .filter((a): a is AnswerRecord & { selected: Option; confidence: NonNullable<Confidence> } =>
          a.selected !== null && a.confidence !== null
        )
        .map((a) => ({
          questionId: a.questionId,
          selected: a.selected,
          confidence: a.confidence,
        }))

      try {
        const { data } = await callFinishSimulado({
          answers: answeredInputs,
          timeSpentSeconds: timeSpent,
        })

        const fullResult = mapFinishOutput(data, finalAnswers, questions)
        setResult(fullResult)
        setLastResult(fullResult)
        setState('finished')
      } catch {
        showSnackbar('Erro ao finalizar simulado. Exibindo resultado local.', 'error')
        // Fallback: still finish locally so user sees the result
        const fallbackResult = buildFallbackResult(finalAnswers, questions, timeSpent)
        setResult(fallbackResult)
        setLastResult(fallbackResult)
        setState('finished')
      } finally {
        setLoadingFinish(false)
      }
    },
    [user, questions, showSnackbar]
  )

  // ── timer ────────────────────────────────────────────────────────────────
  const startTimer = useCallback(
    (startedAt: number, totalSeconds: number) => {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        const left = totalSeconds - elapsed

        if (left <= 0) {
          stopTimer()
          const current = answersRef.current
          const padded = [...current]
          for (const q of questions) {
            if (!padded.find((a) => a.questionId === q.id)) {
              padded.push({
                questionId: q.id,
                selected: null,
                correct: false,
                skipped: false,
                confidence: null,
              })
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
        setConfig(newConfig)

        const { data } = await callGetSimuladoQuestions({
          areas: newConfig.areas,
          total: newConfig.totalQuestions === 0 ? 40 : newConfig.totalQuestions,
        })

        if (!data.questions || data.questions.length === 0) {
          setError('Nenhuma questão encontrada. Execute o seed primeiro.')
          return
        }

        const shuffled = data.questions

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
      } catch {
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

  const next = useCallback(
    (confidence: Confidence, issue?: { comment?: string }) => {
      const current = questions[currentIndex]
      const newAnswer: AnswerRecord = {
        questionId: current.id,
        selected: selectedOption,
        correct: selectedOption === current.resposta,
        skipped: false,
        confidence,
        ...(issue ? { issue } : {}),
      }

      // Fire-and-forget: envia o report imediatamente sem bloquear o fluxo
      if (issue) {
        callReportQuestion({ questionId: current.id, comment: issue.comment }).catch(() => { /* silencioso */ })
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
    },
    [questions, currentIndex, selectedOption, answers, secondsLeft, finish, config]
  )

  const skip = useCallback(() => {
    const current = questions[currentIndex]
    const newAnswer: AnswerRecord = {
      questionId: current.id,
      selected: null,
      correct: false,
      skipped: true,
      confidence: null,
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
  }, [questions, currentIndex, answers, secondsLeft, finish, config])

  const goToQuestion = useCallback(
    (index: number) => {
      if (index < 0 || index >= questions.length) return
      const target = questions[index]
      const prevAnswer = answers.find((a) => a.questionId === target.id)
      setCurrentIndex(index)
      setSelectedOption(prevAnswer?.selected ?? null)
    },
    [questions, answers]
  )

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
    loadingFinish,
    error,
    result,
    lastResult,
    config,
    questionStatuses,
    goToConfig,
    start,
    select,
    next,
    skip,
    goToQuestion,
    retry,
  }
}

///// AUX FUNCTIONS

function mapFinishOutput(
  data: FinishSimuladoOutput,
  localAnswers: AnswerRecord[],
  questions: Question[]
): SimuladoResult {
  // Merge backend answers with local skipped answers for full coverage
  const backendAnswerMap = new Map(data.answers.map((a) => [a.questionId, a]))

  const mergedAnswers: AnswerRecord[] = questions.map((q) => {
    const local = localAnswers.find((a) => a.questionId === q.id)
    const backend = backendAnswerMap.get(q.id)
    if (backend) {
      return {
        questionId: backend.questionId,
        selected: backend.selected,
        correct: backend.correct,
        skipped: false,
        confidence: backend.confidence,
      }
    }
    // Skipped or unanswered — local record
    return local ?? {
      questionId: q.id,
      selected: null,
      correct: false,
      skipped: true,
      confidence: null,
    }
  })

  const questionReviews = questions.map((q) => ({
    id: q.id,
    ano: q.ano,
    area: q.area,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    resposta: q.resposta,
    comentario: q.comentario,
  }))

  return {
    id: data.resultId,
    completedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as SimuladoResult['completedAt'],
    score: data.score,
    totalQuestions: data.totalQuestions,
    timeSpentSeconds: data.timeSpentSeconds,
    areaBreakdown: data.areaBreakdown as SimuladoResult['areaBreakdown'],
    answers: mergedAnswers,
    questionReviews,
  }
}

function buildFallbackResult(
  finalAnswers: AnswerRecord[],
  questions: Question[],
  timeSpent: number
): SimuladoResult {
  const breakdown: Partial<Record<Area, { correct: number; total: number }>> = {}
  for (const q of questions) {
    if (!breakdown[q.area]) breakdown[q.area] = { correct: 0, total: 0 }
    breakdown[q.area]!.total += 1
    const ans = finalAnswers.find((a) => a.questionId === q.id)
    if (ans?.correct) breakdown[q.area]!.correct += 1
  }

  const questionReviews = questions.map((q) => ({
    id: q.id,
    ano: q.ano,
    area: q.area,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    resposta: q.resposta,
    comentario: q.comentario,
  }))

  return {
    id: `local-${Date.now()}`,
    completedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as SimuladoResult['completedAt'],
    score: finalAnswers.filter((a) => a.correct).length,
    totalQuestions: questions.length,
    timeSpentSeconds: timeSpent,
    areaBreakdown: breakdown as SimuladoResult['areaBreakdown'],
    answers: finalAnswers,
    questionReviews,
  }
}
