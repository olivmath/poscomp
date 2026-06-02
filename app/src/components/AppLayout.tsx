import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  )
}
