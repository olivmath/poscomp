import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Announcement } from '../types'

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel', 'class', /^data-/],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    iframe: ['src', 'width', 'height', 'frameborder', 'style', 'allow', 'aria-hidden', 'tabindex'],
    div: [...(defaultSchema.attributes?.div ?? []), 'style', 'class'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'img', 'iframe'],
}

const mdComponents = (color: string) => ({
  a: ({ href, className, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer"
      style={{ color, textDecoration: 'underline' }} {...rest}>{children}</a>
  ),
  img: ({ src, alt, width, height, style }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} width={width} height={height}
      style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6, display: 'block', ...(style as React.CSSProperties) }} />
  ),
  iframe: ({ src, height, ...rest }: React.IframeHTMLAttributes<HTMLIFrameElement>) => (
    <iframe {...rest} src={src} width="100%" height={height ?? 400}
      style={{ display: 'block', border: 'none' }} />
  ),
})

// Remark only parses single-line HTML tags; collapse multi-line tags before rendering
function collapseHtmlTags(md: string): string {
  return md.replace(/<[^<>]+>/gs, (tag) => tag.replace(/\s*\n\s*/g, ' '))
}

function useLumaScript(message: string) {
  useEffect(() => {
    if (!message.includes('luma-checkout--button')) return
    if (document.getElementById('luma-checkout')) return
    const script = document.createElement('script')
    script.id = 'luma-checkout'
    script.src = 'https://embed.lu.ma/checkout-button.js'
    script.async = true
    document.body.appendChild(script)
  }, [message])
}

const THEME: Record<string, { bg: string; border: string; color: string }> = {
  info:    { bg: '#EFF6FF', border: '#93C5FD', color: '#1E40AF' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E' },
  success: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534' },
}

interface Props {
  announcements: Announcement[]
}

export function AnnouncementBanner({ announcements }: Props) {
  useLumaScript(announcements[0]?.message ?? '')
  if (announcements.length === 0) return null
  const a = announcements[0]
  const t = THEME[a.type] ?? THEME.info
  const hasBlock = /<iframe|<img/i.test(a.message)
  return (
    <div
      role="alert"
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.color,
        borderRadius: 16,
        overflow: 'hidden',
        padding: hasBlock ? 0 : '12px 16px',
        fontSize: 14,
        lineHeight: 1.5,
        display: 'flex',
        flexDirection: hasBlock ? 'column' : 'row',
        alignItems: hasBlock ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: hasBlock ? 0 : 12,
      }}
    >
      <div className="announcement-md" style={{ flex: 1, padding: hasBlock ? 0 : undefined }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={mdComponents(t.color)}
        >
          {collapseHtmlTags(a.message)}
        </ReactMarkdown>
      </div>
      {a.url && (
        <a
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: t.color, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4, ...(hasBlock ? { padding: '10px 14px' } : {}) }}
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
