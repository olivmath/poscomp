import { useState, useEffect } from 'react'
import { ModalOverlay } from '../ModalOverlay'
import { useSnackbar } from '../SnackbarProvider'

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
  const [success, setSuccess] = useState(false)
  const { show: showSnackbar } = useSnackbar()

  const handleConfirm = async () => {
    setSuccess(true)
    onConfirm(comment || undefined)

    // Fire-and-forget persistência (não implementado ainda — sequer chamamos backend)
    // Em produção, aqui iria saveProblemReport().catch(err => showSnackbar(...))

    // Auto-close após 1.2s
    setTimeout(() => {
      onCancel()
    }, 1200)
  }

  if (success) {
    return (
      <ModalOverlay>
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="report-success-title">
          <div className="report-success-content">
            <md-icon className="report-success-icon">done</md-icon>
            <h2 id="report-success-title" className="report-success-title">Problema enviado para o suporte</h2>
          </div>
        </div>
      </ModalOverlay>
    )
  }

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
          <button className="modal-btn modal-btn--primary" onClick={handleConfirm}>Confirmar</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
