import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import { useMemo } from 'react'
import { QuestionReviewList } from './QuestionReviewList'
import { AREA_ICONS } from '../utils/areaIcons'
import { formatDuration } from '../utils/formatDuration'
import type { Area, SimuladoResult } from '../types'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ScoreGaugeProps {
  pct: number
  score: number
  total: number
}

function ScoreGauge({ pct, score, total }: ScoreGaugeProps) {
  const filled = (pct / 100) * CIRCUMFERENCE
  const gaugeColor =
    pct >= 70 ? 'var(--color-score-high)' :
    pct >= 50 ? 'var(--color-score-mid)' :
    'var(--color-score-low)'

  return (
    <div className="relatorio-gauge-wrap" aria-label={`Pontuação: ${score} de ${total}, ${pct}%`}>
      <svg className="relatorio-gauge-svg" viewBox="0 0 128 128" aria-hidden="true">
        <circle
          className="relatorio-gauge-track"
          cx="64" cy="64" r={RADIUS}
          fill="none"
          strokeWidth="10"
          stroke="var(--md-sys-color-surface-container-highest)"
        />
        <circle
          className="relatorio-gauge-fill"
          cx="64" cy="64" r={RADIUS}
          fill="none"
          strokeWidth="10"
          stroke={gaugeColor}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          strokeDashoffset="0"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="relatorio-gauge-center">
        <span className="relatorio-gauge-pct" style={{ color: gaugeColor }}>{pct}%</span>
        <span className="relatorio-gauge-fraction">{score}/{total}</span>
      </div>
    </div>
  )
}

interface ConfidenceBarProps {
  label: string
  icon: string
  count: number
  total: number
  colorVar: string
  bgVar: string
}

function ConfidenceBar({ label, icon, count, total, colorVar, bgVar }: ConfidenceBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="relatorio-conf-row" role="presentation">
      <span className="relatorio-conf-label">
        <span className="material-symbols-outlined relatorio-conf-icon" aria-hidden="true">{icon}</span>
        {label}
      </span>
      <div className="relatorio-conf-bar-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${count} questões (${pct}%)`}>
        <div
          className="relatorio-conf-bar-fill"
          style={{ width: `${pct}%`, background: colorVar, '--conf-bg': bgVar } as React.CSSProperties}
        />
      </div>
      <span className="relatorio-conf-count" style={{ color: colorVar }}>{count}</span>
    </div>
  )
}

interface AreaRowProps {
  area: Area
  correct: number
  total: number
}

function AreaRow({ area, correct, total }: AreaRowProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const isGood = pct >= 70
  const color = isGood ? 'var(--color-score-high)' : pct >= 50 ? 'var(--color-score-mid)' : 'var(--color-score-low)'
  const bg = isGood ? 'var(--color-score-high-bg)' : pct >= 50 ? 'var(--color-score-mid-bg)' : 'var(--color-score-low-bg)'

  return (
    <div className="relatorio-area-row">
      <div className="relatorio-area-header">
        <span className="relatorio-area-name">
          <span className="material-symbols-outlined relatorio-area-icon" aria-hidden="true">{AREA_ICONS[area]}</span>
          {area}
        </span>
        <span className="relatorio-area-score" style={{ color }}>{correct}/{total}</span>
      </div>
      <div className="relatorio-area-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${area}: ${pct}%`}>
        <div
          className="relatorio-area-fill"
          style={{ width: `${pct}%`, background: color, '--area-bg': bg } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

export interface RelatorioFinalProps {
  result: SimuladoResult
  onHistory?: () => void
  onReview?: () => void
  onBack?: () => void
}

export function RelatorioFinal({ result, onHistory, onReview, onBack }: RelatorioFinalProps) {
  const pct = Math.round((result.score / result.totalQuestions) * 100)

  const confidenceCounts = useMemo(() => {
    const answered = result.answers ?? []
    return {
      unsure:      answered.filter(a => a.confidence === 'unsure').length,
      studying:    answered.filter(a => a.confidence === 'studying').length,
      should_know: answered.filter(a => a.confidence === 'should_know').length,
      skipped:     answered.filter(a => a.skipped).length,
    }
  }, [result.answers])

  const totalAnswered = result.answers?.length ?? result.totalQuestions

  return (
    <div className="relatorio-page" data-testid="relatorio-final">
      {/* ── Seção 1: Score ── */}
      <section className="relatorio-section relatorio-section--hero" aria-label="Resultado">
        <ScoreGauge pct={pct} score={result.score} total={result.totalQuestions} />
        {result.timeSpentSeconds > 0 && (
          <p className="relatorio-time">
            <span className="material-symbols-outlined relatorio-time-icon" aria-hidden="true">timer</span>
            {formatDuration(result.timeSpentSeconds)}
          </p>
        )}
        <p className="relatorio-tagline">
          {pct >= 70 ? 'Bom desempenho! Continue assim.' :
           pct >= 50 ? 'Na média. Revise os erros.' :
           'Requer atenção. Priorize a revisão.'}
        </p>
      </section>

      {/* ── Seção 2: Distribuição de confiança ── */}
      <section className="relatorio-section" aria-labelledby="conf-heading">
        <h2 className="relatorio-section-title" id="conf-heading">Distribuição de confiança</h2>
        <div className="relatorio-conf-list">
          <ConfidenceBar
            label="Devia saber"
            icon="warning"
            count={confidenceCounts.should_know}
            total={totalAnswered}
            colorVar="var(--color-score-low)"
            bgVar="var(--color-score-low-bg)"
          />
          <ConfidenceBar
            label="Estudando"
            icon="school"
            count={confidenceCounts.studying}
            total={totalAnswered}
            colorVar="var(--color-score-mid)"
            bgVar="var(--color-score-mid-bg)"
          />
          <ConfidenceBar
            label="Não sei"
            icon="help_outline"
            count={confidenceCounts.unsure}
            total={totalAnswered}
            colorVar="var(--md-sys-color-primary)"
            bgVar="var(--md-sys-color-primary-container)"
          />
          {confidenceCounts.skipped > 0 && (
            <ConfidenceBar
              label="Puladas"
              icon="skip_next"
              count={confidenceCounts.skipped}
              total={totalAnswered}
              colorVar="var(--md-sys-color-outline)"
              bgVar="var(--md-sys-color-surface-variant)"
            />
          )}
        </div>
        {confidenceCounts.should_know > 0 && (
          <p className="relatorio-highlight" role="alert">
            <span className="material-symbols-outlined relatorio-highlight-icon" aria-hidden="true">priority_high</span>
            Você tinha <strong>{confidenceCounts.should_know}</strong> questão{confidenceCounts.should_know !== 1 ? 'ões' : ''} que devia saber — priorize a revisão.
          </p>
        )}
      </section>

      {/* ── Seção 3: Por área ── */}
      <section className="relatorio-section" aria-labelledby="area-heading">
        <h2 className="relatorio-section-title" id="area-heading">Por área</h2>
        <div className="relatorio-area-list">
          {AREAS.map(area => {
            const b = result.areaBreakdown?.[area]
            if (!b || b.total === 0) return null
            return <AreaRow key={area} area={area} correct={b.correct} total={b.total} />
          })}
        </div>
      </section>

      {/* ── Seção 4: Questões ── */}
      {result.questionReviews?.length ? (
        <section className="relatorio-section" aria-labelledby="quest-heading">
          <h2 className="relatorio-section-title" id="quest-heading">Questões</h2>
          <QuestionReviewList answers={result.answers ?? []} questions={result.questionReviews} />
        </section>
      ) : null}

      {/* ── Ações ── */}
      <div className="relatorio-actions">
        {onBack && (
          <md-outlined-button onClick={onBack} className="btn-secondary" data-testid="back-btn">
            Voltar
          </md-outlined-button>
        )}
        {onHistory && (
          <md-outlined-button onClick={onHistory} className="btn-secondary" data-testid="history-btn">
            Novo Simulado
          </md-outlined-button>
        )}
        {onReview && result.score < result.totalQuestions && (
          <md-filled-button onClick={onReview} className="btn-primary" data-testid="review-btn">
            Revisar
          </md-filled-button>
        )}
      </div>
    </div>
  )
}
