import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize from 'rehype-sanitize'
import 'katex/dist/katex.min.css'

type Props = { md: string; className?: string }

export default function MarkdownAnswer({ md, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeSanitize]}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
}
