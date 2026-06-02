import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import '@material/web/icon/icon.js'
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

const mdComponents = {
  a: ({ href, className, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer"
      style={{ color: 'inherit', textDecoration: 'underline' }} {...rest}>{children}</a>
  ),
  img: ({ src, alt, width, height, style }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} width={width} height={height}
      style={{ maxWidth: '100%', borderRadius: 12, marginTop: 8, display: 'block', ...(style as React.CSSProperties) }} />
  ),
  iframe: ({ src, height, ...rest }: React.IframeHTMLAttributes<HTMLIFrameElement>) => (
    <iframe {...rest} src={src} width="100%" height={height ?? 400}
      style={{ display: 'block', border: 'none', borderRadius: 12 }} />
  ),
}

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

interface Props {
  announcements: Announcement[]
}

export function AnnouncementBanner({ announcements }: Props) {
  useLumaScript(announcements[0]?.message ?? '')
  if (announcements.length === 0) return null
  const a = announcements[0]
  const typeClass = `announcement-banner--${a.type || 'info'}`
  const hasBlock = /<iframe|<img/i.test(a.message)
  
  return (
    <div
      role="alert"
      className={`announcement-banner ${typeClass} ${hasBlock ? 'announcement-banner--block' : ''}`}
    >
      <div className="announcement-md">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={mdComponents}
        >
          {collapseHtmlTags(a.message)}
        </ReactMarkdown>
      </div>
      {a.url && (
        <a
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="announcement-cta"
        >
          Saiba mais
          <md-icon style={{ '--md-icon-size': '18px' } as any}>open_in_new</md-icon>
        </a>
      )}
    </div>
  )
}
