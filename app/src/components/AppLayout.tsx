import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <SideNav />
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  )
}
