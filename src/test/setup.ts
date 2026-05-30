import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpar componentes após cada teste
afterEach(() => {
  cleanup()
})

// Mock de md-icon e componentes Material Web
customElements.define('md-icon', class extends HTMLElement {})
customElements.define('md-circular-progress', class extends HTMLElement {})
customElements.define('md-filled-button', class extends HTMLElement {})
