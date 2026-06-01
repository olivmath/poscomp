import { ModalOverlay } from '../ModalOverlay'

export function FinishModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="finish-modal-title">
        <h2 id="finish-modal-title" className="modal-title">Finalizar simulado?</h2>
        <p className="modal-body">Esta é a última questão. Ao confirmar, o simulado será encerrado e seu resultado será calculado.</p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--ghost" onClick={onCancel}>Voltar</button>
          <button className="modal-btn modal-btn--primary" onClick={onConfirm}>Finalizar</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
