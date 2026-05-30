import { useState } from 'react'
import { ModalOverlay } from '../ModalOverlay'

export function ReportIssueModal({
  onConfirm,
  onCancel,
  initialComment,
}: {
  onConfirm: (comment?: string) => void
  onCancel: () => void
  initialComment?: string
}) {
  const [comment, setComment] = useState(initialComment || '')

  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <h2 id="report-modal-title" className="modal-title">Reportar problema</h2>
        <textarea
          className="modal-textarea"
          placeholder="Comentário (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          autoFocus
        />
        <div className="modal-actions">
          <button className="modal-btn modal-btn--ghost" onClick={onCancel}>Cancelar</button>
          <button className="modal-btn modal-btn--primary" onClick={() => onConfirm(comment || undefined)}>Confirmar</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
