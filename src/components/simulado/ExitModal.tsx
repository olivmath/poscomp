import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import { ModalOverlay } from '../ModalOverlay'

export function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
        <h2 id="exit-modal-title" className="modal-title">Sair do simulado?</h2>
        <p className="modal-body">Seu progresso será perdido. Esta ação não pode ser desfeita.</p>
        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <md-text-button onClick={onCancel}>Continuar</md-text-button>
          <md-filled-button 
            onClick={onConfirm}
            style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)', '--md-filled-button-label-text-color': 'var(--md-sys-color-on-error)' } as any}
          >
            Sair
          </md-filled-button>
        </div>
      </div>
    </ModalOverlay>
  )
}
