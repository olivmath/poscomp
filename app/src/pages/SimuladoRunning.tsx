import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { Question, SimuladoConfig, SimuladoAnswer, Option, Confidence } from '../types'
import { ExitModal } from '../components/modals/ExitModal'
import { FinishModal } from '../components/modals/FinishModal'
import { QuestionMapModal } from '../components/modals/QuestionMapModal'
import { ReportIssueModal } from '../components/modals/ReportIssueModal'
import { LoadingModal } from '../components/modals/LoadingModal'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

const MATERIA_META: Record<string, { icon: string; label: string }> = {
  'Matemática':  { icon: 'calculate',   label: 'mat'  },
  'Computação':  { icon: 'code',        label: 'comp' },
  'Tecnologias': { icon: 'device_hub',  label: 'fund' },
}

export function SimuladoRunning() {
  const navigate = useNavigate()
  const location = useLocation()
  const config: SimuladoConfig = location.state?.config ?? { materias: [], total: 5, timerMode: 'none' }

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<SimuladoAnswer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingFinish, setLoadingFinish] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const [showExit, setShowExit] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const fn = httpsCallable<SimuladoConfig, { questions: Question[] }>(functions, 'getSimuladoQuestions')
        const r = await fn(config)
        setQuestions(r.data.questions)
        setAnswers(
          r.data.questions.map((q) => ({
            questionId: q.id,
            selected: null,
            confidence: null,
            skipped: false,
          }))
        )
      } catch {
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const secondsPerQ = config.timerMode === '1min' ? 60 : config.timerMode === '2min' ? 120 : 0

  useEffect(() => {
    if (secondsPerQ === 0 || loading) return
    setTimeLeft(secondsPerQ)
  }, [currentIndex, secondsPerQ, loading])

  useEffect(() => {
    if (secondsPerQ === 0 || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, secondsPerQ])

  useEffect(() => {
    if (timeLeft === 0 && secondsPerQ > 0 && !loading) {
      handleSkip()
    }
  }, [timeLeft])

  const current = questions[currentIndex]
  const currentAnswer = answers[currentIndex]

  function updateAnswer(patch: Partial<SimuladoAnswer>) {
    setAnswers((prev) => prev.map((a, i) => (i === currentIndex ? { ...a, ...patch } : a)))
  }

  function handleConfidence(confidence: Confidence) {
    updateAnswer({ confidence })
    if (currentIndex === questions.length - 1) {
      setShowFinish(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleSkip() {
    updateAnswer({ skipped: true })
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  async function handleFinish() {
    setShowFinish(false)
    setLoadingFinish(true)
    try {
      const fn = httpsCallable(functions, 'submitSimulado')
      const r = await fn({ answers, questions })
      navigate('/simulado/resultado', { state: { result: (r.data as { result: unknown }).result } })
    } catch {
      setLoadingFinish(false)
    }
  }

  function handleReport(comment: string) {
    if (window.__DEBUG__) console.log('Report for Q', current?.id, comment)
    setShowReport(false)
  }

  const handleExit = useCallback(() => navigate('/'), [navigate])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, animation: 'spin 1s linear infinite', color: 'var(--md-sys-color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!current) return null

  const progress = ((currentIndex + 1) / questions.length) * 100
  const hasSelected = !!currentAnswer?.selected
  const isAnswered = hasSelected && !!currentAnswer?.confidence

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      {/* ImmersiveBar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--md-sys-color-surface-container)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <button
          onClick={() => setShowExit(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--md-sys-color-on-surface)', padding: 4 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          <span style={{ fontSize: 14 }}>Sair</span>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {currentIndex + 1}/{questions.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {secondsPerQ > 0 && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: timeLeft <= 10 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface)',
              }}
            >
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          )}
          <button
            onClick={() => setShowMap(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            aria-label="Mapa de questões"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>grid_view</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--md-sys-color-outline-variant)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--md-sys-color-primary)', transition: 'width 0.3s' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {/* Materia chip */}
        {MATERIA_META[current.materia] && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12,
            padding: '4px 10px', borderRadius: 20,
            background: 'var(--md-sys-color-surface-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {MATERIA_META[current.materia].icon}
            </span>
            {MATERIA_META[current.materia].label}
          </div>
        )}

        <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>{current.enunciado}</p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {OPTIONS.filter((o) => current.alternativas[o]).map((opt) => {
            const selected = currentAnswer?.selected === opt
            return (
              <button
                key={opt}
                onClick={() => !isAnswered && updateAnswer({ selected: opt })}
                disabled={isAnswered}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  border: `2px solid ${selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                  borderRadius: 10,
                  background: selected ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  cursor: isAnswered ? 'default' : 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)',
                    color: selected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {opt}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{current.alternativas[opt]}</span>
              </button>
            )
          })}
        </div>

        {/* Confidence buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([
            { c: 'unsure' as Confidence, label: 'Não sei', icon: 'help_outline', color: 'var(--md-sys-color-on-surface-variant)' },
            { c: 'studying' as Confidence, label: 'Estudando', icon: 'school', color: 'var(--color-score-mid)' },
            { c: 'should_know' as Confidence, label: 'Devia saber', icon: 'warning', color: 'var(--color-score-low)' },
          ]).map(({ c, label, icon, color }) => (
            <button
              key={c}
              onClick={() => hasSelected && !isAnswered && handleConfidence(c)}
              disabled={!hasSelected || isAnswered}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: 8,
                background: currentAnswer?.confidence === c ? `${color}22` : 'transparent',
                cursor: !hasSelected || isAnswered ? 'not-allowed' : 'pointer',
                opacity: !hasSelected ? 0.4 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
              <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Secondary nav */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => currentIndex > 0 && setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
            style={secondaryBtn(currentIndex === 0)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Anterior
          </button>
          <button onClick={() => setShowReport(true)} style={secondaryBtn(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
            Reportar
          </button>
          <button onClick={handleSkip} style={secondaryBtn(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>skip_next</span>
            Pular
          </button>
        </div>
      </div>

      {showExit && <ExitModal onConfirm={handleExit} onCancel={() => setShowExit(false)} />}
      {showFinish && <FinishModal onConfirm={handleFinish} onCancel={() => setShowFinish(false)} />}
      {showMap && (
        <QuestionMapModal
          answers={answers}
          currentIndex={currentIndex}
          onNavigate={setCurrentIndex}
          onClose={() => setShowMap(false)}
        />
      )}
      {showReport && (
        <ReportIssueModal
          onConfirm={handleReport}
          onCancel={() => setShowReport(false)}
        />
      )}
      {loadingFinish && <LoadingModal />}
    </div>
  )
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 4px',
    border: '1px solid var(--md-sys-color-outline-variant)',
    borderRadius: 8,
    background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: 12,
    color: 'var(--md-sys-color-on-surface-variant)',
  }
}

declare global {
  interface Window { __DEBUG__: boolean }
}
