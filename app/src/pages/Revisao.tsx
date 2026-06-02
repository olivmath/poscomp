import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/progress/circular-progress.js'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRevisao } from '../hooks/useRevisao'
import { useAuth } from '../hooks/useAuth'
import MarkdownAnswer from '../components/MarkdownAnswer'
import type { Priority, AdaptedCard } from '../hooks/useRevisao'

const PRIORITY_LABELS: Record<Priority, { label: string; color: string }> = {
  P1: { label: '🔴 Devia saber', color: 'var(--md-sys-color-error)' },
  P2: { label: '🟡 Estudando',   color: 'var(--md-sys-color-tertiary)' },
  P3: { label: '⚪ Não sei',     color: 'var(--md-sys-color-outline)' },
}

export function Revisao() {
  const navigate = useNavigate()
  const { isPremium, profileLoading } = useAuth()
  const {
    state,
    currentCard,
    currentIndex,
    totalCards,
    showAnswer,
    sessionResults,
    reveal,
    hide,
    submit,
    reset,
  } = useRevisao()

  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [nextDueDays, setNextDueDays] = useState<number | null>(null)

  const handleSubmit = (acertou: boolean) => {
    setFeedback(acertou ? 'correct' : 'wrong')
    setTimeout(() => {
      setFeedback('idle')
      setNextDueDays(null)
      submit(acertou, (days) => setNextDueDays(days))
    }, 500)
  }

  if (profileLoading) {
    return (
      <div className="revisao-container revisao-container--loading">
        <md-circular-progress indeterminate />
        <p>Carregando...</p>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="revisao-container revisao-container--center">
        <div className="revisao-paywall-card">
          <span className="material-symbols-outlined revisao-paywall-icon">lock</span>
          <h2 className="revisao-paywall-title">Recurso Premium</h2>
          <p className="revisao-paywall-desc">
            A revisão espaçada é exclusiva para assinantes.
          </p>
          <md-filled-button onClick={() => navigate('/perfil')}>
            Assinar Agora
          </md-filled-button>
        </div>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="revisao-container revisao-container--loading">
        <md-circular-progress indeterminate />
        <p>Carregando revisão...</p>
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="revisao-container revisao-container--center">
        <div className="revisao-card revisao-card--empty">
          <span className="material-symbols-outlined md-icon--lg">celebration</span>
          <h2 className="revisao-title">Tudo em dia!</h2>
          <p className="revisao-text">
            Nenhuma questão para revisar hoje. Volte amanhã ou faça um novo simulado.
          </p>
          <div className="revisao-actions">
            <md-filled-button onClick={() => { reset(); navigate('/', { state: { action: 'openSimuladoConfig' } }) }}>
              Fazer Simulado
            </md-filled-button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'finished') {
    return (
      <div className="revisao-container revisao-container--center">
        <div className="revisao-card revisao-card--finished">
          <span className="material-symbols-outlined md-icon--lg">check_circle</span>
          <h2 className="revisao-title">Sessão concluída!</h2>
          <p className="revisao-text">{totalCards} cards revisados</p>

          <div className="revisao-stats">
            <div className="revisao-stat-row">
              <span className="revisao-stat-dot" style={{ backgroundColor: PRIORITY_LABELS.P1.color }} />
              <span className="revisao-stat-label">Devia saber</span>
              <span className="revisao-stat-value">{sessionResults.P1}</span>
            </div>
            <div className="revisao-stat-row">
              <span className="revisao-stat-dot" style={{ backgroundColor: PRIORITY_LABELS.P2.color }} />
              <span className="revisao-stat-label">Estudando</span>
              <span className="revisao-stat-value">{sessionResults.P2}</span>
            </div>
            <div className="revisao-stat-row">
              <span className="revisao-stat-dot" style={{ backgroundColor: PRIORITY_LABELS.P3.color }} />
              <span className="revisao-stat-label">Não sei</span>
              <span className="revisao-stat-value">{sessionResults.P3}</span>
            </div>
          </div>

          <div className="revisao-actions">
            <md-filled-button onClick={() => { reset(); navigate('/', { state: { action: 'openSimuladoConfig' } }) }}>
              Fazer Simulado
            </md-filled-button>
          </div>
        </div>
      </div>
    )
  }

  const card = currentCard as AdaptedCard
  const { question } = card

  return (
    <div className="revisao-running">
      <h1 className="sr-only">Revisão</h1>
      {/* Top bar */}
      <div className="revisao-top-bar">
        <button className="revisao-top-back" onClick={() => navigate('/')} aria-label="Sair da revisão">
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="revisao-top-counter">{currentIndex + 1} / {totalCards}</span>
      </div>

      {/* Barra de progresso */}
      <div className="revisao-progress-strip">
        <div
          className="revisao-progress-fill"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Área do card */}
      <div className="revisao-card-wrap" aria-live="polite" aria-atomic="false">
        <div
          className={`revisao-flipcard${showAnswer ? ' flipped' : ''}${feedback !== 'idle' ? ` feedback-${feedback}` : ''}`}
          onClick={question ? () => showAnswer ? hide() : reveal() : undefined}
        >
          {/* Frente — pergunta */}
          <div className="revisao-face revisao-face--front">
            <p className="revisao-question-text">
              {question?.enunciado ?? 'Carregando questão...'}
            </p>
            <div className="revisao-flip-hint">
              <span className="material-symbols-outlined">touch_app</span>
              Toque para ver a resposta
            </div>
          </div>

          {/* Verso — resposta */}
          <div className="revisao-face revisao-face--back">
            <div className={`revisao-answer-body${question?.card?.resposta ? ' revisao-answer-body--markdown' : ''}`}>
              {question?.card?.resposta ? (
                <div className="revisao-gabarito-markdown">
                  <MarkdownAnswer md={question.card.resposta} />
                </div>
              ) : (
                <p className="revisao-gabarito">
                  <strong>({question?.resposta})</strong>{' '}
                  {question && question.alternativas[question.resposta]}
                </p>
              )}
            </div>

            <div className="revisao-flip-hint revisao-flip-hint--back">
              <span className="material-symbols-outlined">touch_app</span>
              Toque para ver a pergunta
            </div>
          </div>
        </div>

        {/* Botões sempre visíveis — desacoplados do flip */}
        <div className="revisao-result-btns">
          <button
            className="revisao-result-btn revisao-result-btn--wrong"
            onClick={() => handleSubmit(false)}
          >
            <span className="material-symbols-outlined">close</span>
            Errei
          </button>
          <button
            className="revisao-result-btn revisao-result-btn--correct"
            onClick={() => handleSubmit(true)}
          >
            <span className="material-symbols-outlined">check</span>
            Acertei
          </button>
        </div>

        {nextDueDays !== null && (
          <p className="revisao-next-due" aria-live="polite">
            <span className="material-symbols-outlined revisao-next-due-icon">schedule</span>
            {nextDueDays === 0
              ? 'Revisão: hoje'
              : nextDueDays === 1
              ? 'Próxima revisão: amanhã'
              : `Próxima revisão: em ${nextDueDays} dias`}
          </p>
        )}
      </div>
    </div>
  )
}
