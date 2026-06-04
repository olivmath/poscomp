import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

window.__DEBUG__ = localStorage.getItem('debugLogs') === 'true'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

declare global {
  interface Window { __DEBUG__: boolean }
}
