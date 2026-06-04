import { useNavigate } from 'react-router-dom'
import { ScoreGauge } from './ScoreGauge'
import { SimuladoResult } from '../types'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'

interface RelatorioFinalProps {
  result: SimuladoResult
  variant: 'post-simulado' | 'historico-detalhe'
  onNewSimulado?: () => void
}

const TAGLINE: Record<string, string> = {
  high: 'Bom desempenho! Continue assim.',
  mid: 'Na média. Revise os erros.',
  low: 'Requer atenção. Priorize a revisão.',
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}min ${s}seg`
}

export function RelatorioFinal({ result, variant, onNewSimulado }: RelatorioFinalProps) {
  const navigate = useNavigate()
  const pct = result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0
  const level = pct >= 70 ? 'high' : pct >= 50 ? 'mid' : 'low'

  const confidenceCounts = { should_know: 0, studying: 0, unsure: 0 }
  for (const a of result.answers) {
    if (!a.correct && a.confidence) confidenceCounts[a.confidence]++
  }

  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="page-shell section-stack">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <ScoreGauge score={result.score} total={result.totalQuestions} />
        {result.timeSpentSeconds > 0 && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {formatTime(result.timeSpentSeconds)}
          </p>
        )}
        <p style={{ margin: 0, fontSize: 14 }}>{TAGLINE[level]}</p>
      </div>

      <div className="card">
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Distribuição</p>
        {[
          { key: 'should_know', label: 'Devia saber', icon: 'warning', color: 'var(--color-score-low)' },
          { key: 'studying', label: 'Estudando', icon: 'school', color: 'var(--color-score-mid)' },
          { key: 'unsure', label: 'Não sei', icon: 'help_outline', color: 'var(--md-sys-color-on-surface-variant)' },
        ].map(({ key, label, icon, color }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{confidenceCounts[key as keyof typeof confidenceCounts]}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Por matéria</p>
        {Object.entries(result.materiaBreakdown).map(([m, s]) => {
          const p = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
          const c = p >= 70 ? 'var(--color-score-high)' : p >= 50 ? 'var(--color-score-mid)' : 'var(--color-score-low)'
          return (
            <div key={m} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                <span>{m}</span>
                <span style={{ color: c }}>{s.correct}/{s.total}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--md-sys-color-outline-variant)' }}>
                <div style={{ height: '100%', width: `${p}%`, borderRadius: 3, background: c }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Questões</p>
        {result.answers.map((a, i) => (
          <div key={a.questionId} style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: 8, marginBottom: 8 }}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 0,
                textAlign: 'left',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: a.correct ? 'var(--color-score-high)' : 'var(--color-score-low)' }}
              >
                {a.correct ? 'check_circle' : 'cancel'}
              </span>
              <span style={{ fontSize: 13, flex: 1 }}>Q{i + 1} — {a.question.enunciado.slice(0, 60)}...</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.5 }}>
                {expanded === i ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expanded === i && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                <p style={{ margin: '0 0 4px' }}>Sua resposta: <strong>{a.selected}</strong> — Gabarito: <strong style={{ color: 'var(--color-score-high)' }}>{a.question.resposta}</strong></p>
                {a.question.comentario && <p style={{ margin: 0 }}>{a.question.comentario}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {variant === 'post-simulado' && (
        <div style={{ display: 'flex', gap: 12 }}>
          {/* @ts-expect-error custom element */}
          <md-outlined-button style={{ flex: 1 }} onClick={onNewSimulado}>Novo Simulado</md-outlined-button>
          {/* @ts-expect-error custom element */}
          <md-filled-button style={{ flex: 1 }} onClick={() => navigate('/revisao')}>Revisar</md-filled-button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
