import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useImmersiveMode } from '../contexts/ImmersiveModeContext'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isImmersive } = useImmersiveMode()

  return (
    <div className="app-layout">
      <main className="app-content">{children}</main>
      {!isImmersive && <BottomNav />}
    </div>
  )
}
