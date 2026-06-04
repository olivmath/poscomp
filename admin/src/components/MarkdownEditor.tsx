import { useMemo } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\n/g, '<br />')
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 6 }: Props) {
  const preview = useMemo(() => renderMarkdown(value), [value])

  return (
    <div className="md-split">
      <textarea
        className="textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Escreva em Markdown...'}
        rows={rows}
        style={{ minHeight: `${rows * 22}px` }}
      />
      <div
        className="md-preview"
        style={{ minHeight: `${rows * 22}px` }}
        dangerouslySetInnerHTML={{ __html: preview || '<span style="color:var(--md-sys-color-on-surface-variant)">Preview...</span>' }}
      />
    </div>
  )
}
