import { createContext, useContext, ReactNode } from 'react'
import { useSrs } from '../hooks/useSrs'
import type { SrsCard, Grade, SimuladoResult } from '../types'

interface SrsContextType {
  pendingCards: SrsCard[]
  totalPending: number
  loading: boolean
  upsertFromResult: (result: SimuladoResult) => Promise<void>
  updateCard: (questionId: string, grade: Grade, studied?: boolean) => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const SrsContext = createContext<SrsContextType>({
  pendingCards: [],
  totalPending: 0,
  loading: false,
  upsertFromResult: async () => {},
  updateCard: async () => {},
})

export function SrsProvider({ children }: { children: ReactNode }) {
  const srs = useSrs()
  return <SrsContext.Provider value={srs}>{children}</SrsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSrsContext(): SrsContextType {
  return useContext(SrsContext)
}
