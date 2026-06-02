import 'react'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }

  namespace JSX {
    interface IntrinsicElements {
      'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean
        href?: string
        target?: string
        trailing_icon?: boolean
      }, HTMLElement>
      'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean
        href?: string
      }, HTMLElement>
      'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean
        href?: string
      }, HTMLElement>
      'md-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'md-list-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        headline?: string
        'supporting-text'?: string
        disabled?: boolean
        type?: 'button' | 'link' | 'text'
      }, HTMLElement>
      'md-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        selected?: boolean
        disabled?: boolean
        icons?: boolean
      }, HTMLElement>
    }
  }
}
