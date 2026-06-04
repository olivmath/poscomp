import { useState } from 'react'
import { Question } from '../types'

interface FlipcardProps {
  question: Question
}

export function Flipcard({ question }: FlipcardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      style={{ perspective: 1000, cursor: 'pointer', minHeight: 240 }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 240,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="card"
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 240,
          }}
        >
          <p style={{ margin: 0, lineHeight: 1.5 }}>{question.card.pergunta || question.enunciado}</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
            Toque para ver a resposta
          </p>
        </div>
        <div
          className="card"
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 240,
            background: 'var(--md-sys-color-primary-container)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Resposta: {question.resposta}</p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{question.card.resposta || question.alternativas[question.resposta]}</p>
          {question.comentario && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
              {question.comentario}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
