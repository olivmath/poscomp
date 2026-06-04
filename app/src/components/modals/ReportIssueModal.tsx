import { useState } from 'react'
import { ModalOverlay } from './ModalOverlay'

interface ReportIssueModalProps {
  initialComment?: string
  onConfirm: (comment: string) => void
  onCancel: () => void
}

export function ReportIssueModal({ initialComment = '', onConfirm, onCancel }: ReportIssueModalProps) {
  const [text, setText] = useState(initialComment)

  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Reportar problema</h3>
      <p style={{ margin: '0 0 12px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
        Descreva o problema com esta questão.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Ex: enunciado incorreto, alternativa errada..."
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid var(--md-sys-color-outline)',
          background: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          fontSize: 14,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 16px',
            color: 'var(--md-sys-color-primary)',
            fontWeight: 600,
            borderRadius: 8,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(text)}
          disabled={!text.trim()}
          style={{
            background: text.trim() ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            border: 'none',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            padding: '10px 20px',
            color: text.trim() ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 600,
            borderRadius: 8,
          }}
        >
          Confirmar
        </button>
      </div>
    </ModalOverlay>
  )
}
