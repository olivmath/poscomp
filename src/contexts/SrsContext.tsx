import { createContext, useContext, ReactNode } from 'react'
import { useSrs, type UseSrsReturn } from '../hooks/useSrs'

export type { UseSrsReturn }

// eslint-disable-next-line react-refresh/only-export-components
export const SrsContext = createContext<UseSrsReturn | undefined>(undefined)

export function SrsProvider({ children }: { children: ReactNode }) {
  const srs = useSrs()
  return <SrsContext.Provider value={srs}>{children}</SrsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSrsContext(): UseSrsReturn {
  const ctx = useContext(SrsContext)
  if (!ctx) throw new Error('useSrsContext must be used inside SrsProvider')
  return ctx
}
