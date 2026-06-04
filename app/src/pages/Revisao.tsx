import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Flipcard } from '../components/Flipcard'
import { PaywallCard } from '../components/PaywallCard'
import { SrsCard } from '../types'

type State = 'loading' | 'paywall' | 'empty' | 'running' | 'finished'

interface SessionResult {
  should_know: number
  studying: number
  unsure: number
}

export function Revisao() {
  const navigate = useNavigate()
  const { user, userDoc } = useAuth()
  const [state, setState] = useState<State>('loading')
  const [cards, setCards] = useState<SrsCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionResult, setSessionResult] = useState<SessionResult>({ should_know: 0, studying: 0, unsure: 0 })
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!userDoc) return
    if (!userDoc.isPremium) {
      setState('paywall')
      return
    }
    if (!user) return

    const fn = httpsCallable<Record<string, never>, { cards: SrsCard[] }>(functions, 'getSrsQueue')
    fn({})
      .then((r) => {
        const c = r.data.cards
        if (c.length === 0) {
          setState('empty')
        } else {
          setCards(c)
          setState('running')
        }
      })
      .catch(() => setState('empty'))
  }, [user, userDoc])

  async function handleAnswer(correct: boolean) {
    const card = cards[currentIndex]
    const feedback = correct ? 'Próxima revisão: mais tarde' : 'Próxima revisão: amanhã'
    setFeedback(feedback)

    try {
      const fn = httpsCallable(functions, 'updateSrsCard')
      await fn({ cardId: card.questionId, correct })
    } catch {
      // non-blocking
    }

    setSessionResult((prev) => {
      const key = card.lastConfidence as keyof SessionResult
      return { ...prev, [key]: (prev[key] ?? 0) + 1 }
    })

    setTimeout(() => {
      setFeedback('')
      if (currentIndex >= cards.length - 1) {
        setState('finished')
      } else {
        setCurrentIndex((i) => i + 1)
      }
    }, 500)
  }

  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0

  if (state === 'loading') {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (state === 'paywall') {
    return (
      <div className="page-shell">
        <PaywallCard
          title="Recurso Premium"
          description="A revisão espaçada é exclusiva para assinantes."
          ctaLabel="Ver planos"
          onCta={() => navigate('/perfil')}
        />
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined">celebration</span>
        <h2 style={{ margin: 0 }}>Tudo em dia!</h2>
        <p style={{ margin: 0 }}>Nenhuma questão para revisar hoje. Volte amanhã ou faça um simulado.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: 'var(--md-sys-color-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'var(--md-sys-color-on-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fazer Simulado
        </button>
      </div>
    )
  }

  if (state === 'finished') {
    const total = Object.values(sessionResult).reduce((a, b) => a + b, 0)
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined" style={{ color: 'var(--color-score-high)' }}>
          check_circle
        </span>
        <h2 style={{ margin: 0 }}>Sessão concluída!</h2>
        <p style={{ margin: 0 }}>{total} cards revisados</p>
        <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'should_know', label: 'Devia saber', color: 'var(--color-score-low)' },
            { key: 'studying', label: 'Estudando', color: 'var(--color-score-mid)' },
            { key: 'unsure', label: 'Não sei', color: 'var(--md-sys-color-on-surface-variant)' },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color }}>● {label}</span>
              <span style={{ fontWeight: 600 }}>{sessionResult[key as keyof SessionResult]}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: 'var(--md-sys-color-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'var(--md-sys-color-on-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Fazer Simulado
        </button>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 56px)' }}>
      {/* Progress strip */}
      <div style={{ height: 4, background: 'var(--md-sys-color-outline-variant)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--md-sys-color-primary)', transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <Flipcard question={currentCard.question} />

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => handleAnswer(false)}
            style={{
              flex: 1,
              padding: '14px 0',
              border: '2px solid var(--color-score-low)',
              borderRadius: 10,
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-score-low)',
              fontWeight: 700,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            Errei
          </button>
          <button
            onClick={() => handleAnswer(true)}
            style={{
              flex: 1,
              padding: '14px 0',
              border: '2px solid var(--color-score-high)',
              borderRadius: 10,
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-score-high)',
              fontWeight: 700,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Acertei
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
          </button>
        </div>

        {feedback && (
          <p
            style={{
              margin: 0,
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--md-sys-color-on-surface-variant)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {feedback}
          </p>
        )}
      </div>
    </div>
  )
}
