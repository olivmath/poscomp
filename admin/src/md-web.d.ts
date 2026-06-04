/* Declarações JSX para os web components do @material/web */
import type { MdDialog } from '@material/web/dialog/dialog.js'
import type { MdSwitch } from '@material/web/switch/switch.js'
import type { MdMenu } from '@material/web/menu/menu.js'
import type { MdMenuItem } from '@material/web/menu/menu-item.js'
import type { MdFilledButton } from '@material/web/button/filled-button.js'
import type { MdOutlinedButton } from '@material/web/button/outlined-button.js'
import type { MdTextButton } from '@material/web/button/text-button.js'
import type { MdCircularProgress } from '@material/web/progress/circular-progress.js'
import type { MdRadio } from '@material/web/radio/radio.js'
import type { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js'

type WebComponentProps<T> = Partial<
  Omit<T, keyof HTMLElement> & React.DOMAttributes<HTMLElement>
> & React.HTMLAttributes<HTMLElement>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-dialog': WebComponentProps<MdDialog> & { open?: boolean }
      'md-switch': WebComponentProps<MdSwitch> & { selected?: boolean; disabled?: boolean; onChange?: React.ChangeEventHandler<HTMLInputElement> }
      'md-menu': WebComponentProps<MdMenu> & { open?: boolean; anchor?: string }
      'md-menu-item': WebComponentProps<MdMenuItem> & { onClick?: React.MouseEventHandler<HTMLElement> }
      'md-filled-button': WebComponentProps<MdFilledButton> & { disabled?: boolean; onClick?: React.MouseEventHandler<HTMLElement> }
      'md-outlined-button': WebComponentProps<MdOutlinedButton> & { disabled?: boolean; onClick?: React.MouseEventHandler<HTMLElement> }
      'md-text-button': WebComponentProps<MdTextButton> & { disabled?: boolean; onClick?: React.MouseEventHandler<HTMLElement> }
      'md-circular-progress': WebComponentProps<MdCircularProgress> & { indeterminate?: boolean; value?: number }
      'md-radio': WebComponentProps<MdRadio> & { name?: string; value?: string; checked?: boolean; onChange?: React.ChangeEventHandler<HTMLInputElement> }
      'md-outlined-text-field': WebComponentProps<MdOutlinedTextField> & { label?: string; value?: string; type?: string; onInput?: React.FormEventHandler<HTMLElement> }
    }
  }
}
