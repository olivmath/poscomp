import 'react'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }

  namespace JSX {
    interface IntrinsicElements {
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
      'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean
      }, HTMLElement>
      'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean
        href?: string
      }, HTMLElement>
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        indeterminate?: boolean
        value?: number
        max?: number
      }, HTMLElement>
      'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        indeterminate?: boolean
        value?: number
        max?: number
        buffer?: number
      }, HTMLElement>
      'md-navigation-bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        activeTabIndex?: number
        onNavigationTabActivated?: (e: CustomEvent) => void
      }, HTMLElement>
      'md-navigation-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string
        active?: boolean
        'hide-inactive-label'?: boolean
      }, HTMLElement>
      'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        open?: boolean
        quick?: boolean
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
      'md-chip-set': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'md-filter-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string
        selected?: boolean
        disabled?: boolean
      }, HTMLElement>
      'md-outlined-segmented-button-set': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'md-outlined-segmented-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string
        selected?: boolean
        disabled?: boolean
      }, HTMLElement>
      'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string
        value?: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput?: (e: any) => void
      }, HTMLElement>
    }
  }
}
