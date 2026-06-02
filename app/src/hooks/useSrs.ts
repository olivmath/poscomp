import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { callGetPendingCards } from './useFunctions'
import type { SrsCard } from '../types'

export interface UseSrsReturn {
  pendingCards: SrsCard[]
  totalPending: number
  loading: boolean
}

export function useSrs(): UseSrsReturn {
  const { user } = useAuth()
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPendingCards = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const { data } = await callGetPendingCards({})
      setTotalPending(data.cards.length)
    } catch {
      // silently ignore — badge shows 0
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadPendingCards()
  }, [user, loadPendingCards])

  return {
    // BottomNav only needs totalPending — pendingCards kept for interface compatibility
    pendingCards: [],
    totalPending,
    loading,
  }
}
