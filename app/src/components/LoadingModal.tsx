import '@material/web/progress/circular-progress.js'
import { ModalOverlay } from './ModalOverlay'

export function LoadingModal({
  open,
  label,
}: {
  open: boolean
  label: string
}) {
  if (!open) return null

  return (
    <ModalOverlay>
      <div
        className="loading-modal-card"
        role="progressdialog"
        aria-live="polite"
        aria-label={label}
      >
        <md-circular-progress indeterminate />
        <p className="loading-modal-label">{label}</p>
      </div>
    </ModalOverlay>
  )
}
