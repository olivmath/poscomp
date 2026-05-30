import { ModalOverlay } from '../ModalOverlay'

export function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
        <h2 id="exit-modal-title" className="modal-title">Sair do simulado?</h2>
        <p className="modal-body">Seu progresso será perdido. Esta ação não pode ser desfeita.</p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--ghost" onClick={onCancel}>Continuar</button>
          <button className="modal-btn modal-btn--danger" onClick={onConfirm}>Sair</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
