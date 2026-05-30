import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup após cada teste
afterEach(() => {
  cleanup()
})

// Mock para Material Web (evita erros de custom elements)
beforeEach(() => {
  if (!customElements.get('md-circular-progress')) {
    customElements.define('md-circular-progress', class extends HTMLElement {})
  }
})

// Mock localStorage
const localStorageMock: Storage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
