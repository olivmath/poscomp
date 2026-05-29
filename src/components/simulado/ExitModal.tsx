import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/dialog/dialog.js'
import { useEffect, useRef } from 'react'

export function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [onCancel])

  return (
    <md-dialog ref={dialogRef} open onClick={(e) => e.stopPropagation()}>
      <div slot="headline">Sair do simulado?</div>
      <div slot="content">Seu progresso será perdido. Esta ação não pode ser desfeita.</div>
      <div slot="actions">
        <md-text-button onClick={onCancel}>Continuar</md-text-button>
        <md-filled-button onClick={onConfirm}>Sair</md-filled-button>
      </div>
    </md-dialog>
  )
}
