import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/dialog/dialog.js'
import '@material/web/textfield/outlined-text-field.js'
import { useState, useRef } from 'react'

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
  const dialogRef = useRef<HTMLElement>(null)

  return (
    <md-dialog ref={dialogRef} open onClick={(e) => e.stopPropagation()}>
      <div slot="headline">Reportar problema</div>
      <div slot="content">
        <md-outlined-text-field
          label="Comentário (opcional)"
          value={comment}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onInput={(e: any) => setComment(e.target.value)}
        />
      </div>
      <div slot="actions">
        <md-text-button onClick={onCancel}>Cancelar</md-text-button>
        <md-filled-button onClick={() => onConfirm(comment || undefined)}>Confirmar</md-filled-button>
      </div>
    </md-dialog>
  )
}
