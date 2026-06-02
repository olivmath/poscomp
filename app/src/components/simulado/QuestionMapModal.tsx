import { ModalOverlay } from '../ModalOverlay'
import type { QuestionStatus } from '../../types'

const LEGEND = [
  { status: 'unvisited',   label: 'Não visitada' },
  { status: 'skipped',     label: 'Pulada'        },
  { status: 'unsure',      label: 'Não sei'        },
  { status: 'studying',    label: 'Estudando'      },
  { status: 'should_know', label: 'Devia saber'    },
] as const

export function QuestionMapModal({
  statuses,
  currentIndex,
  onGo,
  onClose,
}: {
  statuses: QuestionStatus[]
  currentIndex: number
  onGo: (index: number) => void
  onClose: () => void
}) {
  return (
    <ModalOverlay onBackdropClick={onClose}>
      <div className="modal-card modal-card--map" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
        <div className="modal-map-header">
          <h2 id="map-modal-title" className="modal-title">Mapa de questões</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar mapa">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="question-map-grid" data-testid="question-map-grid">
          {statuses.map((status, i) => (
            <button
              key={i}
              className={`question-map-btn question-map-btn--${status.replace(/_/g, '-')} ${i === currentIndex ? 'question-map-btn--current' : ''}`}
              onClick={() => { onGo(i); onClose() }}
              aria-label={`Questão ${i + 1} — ${status}`}
              data-testid={`map-q-${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="question-map-legend">
          {LEGEND.map(({ status, label }) => (
            <span key={status} className="map-legend-item">
              <span className={`map-legend-dot map-legend-dot--${status.replace(/_/g, '-')}`} />
              {label}
            </span>
          ))}
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
