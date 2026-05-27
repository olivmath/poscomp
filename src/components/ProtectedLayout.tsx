import { type ReactNode } from 'react'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}
