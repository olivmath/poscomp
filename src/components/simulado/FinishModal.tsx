import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import { ModalOverlay } from '../ModalOverlay'

export function FinishModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="finish-modal-title">
        <h2 id="finish-modal-title" className="modal-title">Finalizar simulado?</h2>
        <p className="modal-body">Esta é a última questão. Ao confirmar, o simulado será encerrado e seu resultado será calculado.</p>
        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <md-text-button onClick={onCancel}>Voltar</md-text-button>
          <md-filled-button onClick={onConfirm}>Finalizar</md-filled-button>
        </div>
      </div>
    </ModalOverlay>
  )
}
