import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/dialog/dialog.js'

export function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <md-dialog open onClick={(e) => e.stopPropagation()}>
      <div slot="headline">Sair do simulado?</div>
      <div slot="content">Seu progresso será perdido. Esta ação não pode ser desfeita.</div>
      <div slot="actions">
        <md-text-button onClick={onCancel}>Continuar</md-text-button>
        <md-filled-button onClick={onConfirm}>Sair</md-filled-button>
      </div>
    </md-dialog>
  )
}
