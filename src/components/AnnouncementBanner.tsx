import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import type { Announcement } from '../types'

const THEME: Record<string, { bg: string; border: string; color: string }> = {
  info:    { bg: '#EFF6FF', border: '#93C5FD', color: '#1E40AF' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E' },
  success: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534' },
}

interface Props {
  announcements: Announcement[]
}

export function AnnouncementBanner({ announcements }: Props) {
  if (announcements.length === 0) return null
  const a = announcements[0]
  const t = THEME[a.type] ?? THEME.info
  return (
    <div
      role="alert"
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        borderRadius: 16,
        padding: '12px 16px',
        fontSize: 14,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div className="announcement-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {a.message}
        </ReactMarkdown>
      </div>
      {a.url && (
        <a
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: t.color, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Saiba mais
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}
    </div>
  )
}
