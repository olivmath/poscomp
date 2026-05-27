// Type declarations for @material/web Web Components used as JSX elements
declare namespace React {
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
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        indeterminate?: boolean
        value?: number
        max?: number
      }, HTMLElement>
    }
  }
}
