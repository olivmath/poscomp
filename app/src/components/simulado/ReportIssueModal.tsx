import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'
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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onCancel()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [success, onCancel])

  const handleSubmit = async () => {
    setSuccess(true)

    // Fire-and-forget com snackbar de erro
    try {
      // TODO: chamar função de persistência quando existir
      // await saveProblemReport(comment)
    } catch {
      showSnackbar('Erro ao enviar relatório', 'error')
      setSuccess(false)
    }

    onConfirm(comment || undefined)
  }

  if (success) {
    return (
      <ModalOverlay>
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-success-title"
        >
          <div className="report-success-content">
            <md-icon className="report-success-icon">done</md-icon>
            <h2 id="report-success-title" className="modal-title">Problema enviado</h2>
            <p className="modal-body">Obrigado por reportar. Analisaremos em breve.</p>
          </div>
        </div>
      </ModalOverlay>
    )
  }

  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <h2 id="report-modal-title" className="modal-title">Reportar problema</h2>
        <textarea
          className="modal-textarea"
          placeholder="Comentário (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          autoFocus
        />
        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <md-text-button onClick={onCancel}>
            Cancelar
          </md-text-button>
          <md-filled-button onClick={handleSubmit}>
            Enviar
          </md-filled-button>
        </div>
      </div>
    </ModalOverlay>
  )
}
