import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/progress/circular-progress.js'
import { useNavigate } from 'react-router-dom'
import { useRevisao } from '../hooks/useRevisao'
import { AREA_ICONS } from '../utils/areaIcons'
import type { Priority } from '../hooks/useRevisao'

const PRIORITY_LABELS: Record<Priority, { label: string; color: string }> = {
  P1: { label: '🔴 Devia saber', color: 'var(--md-sys-color-error)' },
  P2: { label: '🟡 Estudando',   color: 'var(--md-sys-color-tertiary)' },
  P3: { label: '⚪ Não sei',     color: 'var(--md-sys-color-outline)' },
}

export function Revisao() {
  const navigate = useNavigate()
  const {
    state,
    currentCard,
    currentIndex,
    totalCards,
    showAnswer,
    sessionResults,
    reveal,
    submit,
    reset,
  } = useRevisao()

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
      <div className="revisao-container">
        <div className="revisao-card revisao-card--empty">
          <span className="material-symbols-outlined md-icon--lg">celebration</span>
          <h2 className="revisao-title">Tudo em dia!</h2>
          <p className="revisao-text">
            Nenhuma questão para revisar hoje. Volte amanhã ou faça um novo simulado.
          </p>
          <div className="revisao-actions">
            <md-outlined-button onClick={() => navigate('/')}>Início</md-outlined-button>
            <md-filled-button onClick={() => navigate('/simulado')}>Fazer Simulado</md-filled-button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'finished') {
    return (
      <div className="revisao-container">
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
            <md-outlined-button onClick={() => { reset(); navigate('/') }}>Início</md-outlined-button>
            <md-filled-button onClick={() => { reset(); navigate('/simulado') }}>Fazer Simulado</md-filled-button>
          </div>
        </div>
      </div>
    )
  }

  const { priority, question } = currentCard
  const pInfo = PRIORITY_LABELS[priority]

  return (
    <div className="revisao-container">
      {/* Header / Progress */}
      <div className="revisao-header">
        <button className="revisao-back-btn" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="revisao-progress-text">
          {currentIndex + 1} / {totalCards}
        </span>
        <div className="revisao-progress-bar">
          <div 
            className="revisao-progress-fill" 
            style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }} 
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="revisao-flashcard">
        <div className="revisao-card-priority">
          <span className="revisao-priority-tag" style={{ color: pInfo.color }}>
            {pInfo.label}
          </span>
          <span className="revisao-area-tag">
            <span className="material-symbols-outlined revisao-area-icon">
              {question ? AREA_ICONS[question.area] : 'help'}
            </span>
            {question?.area ?? '...'}
          </span>
        </div>

        <div className="revisao-question-body">
          <p className="revisao-question-text">
            {question?.enunciado ?? 'Carregando questão...'}
          </p>

          {showAnswer && question && (
            <div className="revisao-answer-box">
              <div className="revisao-gabarito">
                <span className="material-symbols-outlined revisao-check-icon">check_circle</span>
                <strong>Gabarito: ({question.resposta})</strong> {question.alternativas[question.resposta]}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="revisao-footer">
          {!showAnswer ? (
            <md-filled-button 
              className="revisao-reveal-btn" 
              onClick={reveal}
              disabled={!question}
            >
              Revelar gabarito
            </md-filled-button>
          ) : (
            <div className="revisao-studying-actions">
              <md-outlined-button 
                className="revisao-btn--no" 
                onClick={() => submit(false)}
              >
                Não estudei
              </md-outlined-button>
              <md-filled-button 
                className="revisao-btn--yes" 
                onClick={() => submit(true)}
              >
                Estudei
              </md-filled-button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
