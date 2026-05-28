import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { callGetPendingCards } from './useFunctions'
import { isAuthBypassed } from '../utils/bypass'
import type { SrsCard } from '../types'

export interface UseSrsReturn {
  pendingCards: SrsCard[]
  totalPending: number
  loading: boolean
}

// Globals injetados via page.addInitScript nos testes E2E
declare global {
  interface Window {
    __AUTH_BYPASS__?: boolean
    __SRS_MOCK__?: SrsCard[]
  }
}

export function useSrs(): UseSrsReturn {
  const { user } = useAuth()
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPendingCards = useCallback(async (): Promise<void> => {
    // Bypass de teste: usa dados injetados via window.__SRS_MOCK__
    if (isAuthBypassed() && window.__SRS_MOCK__ !== undefined) {
      setTotalPending(window.__SRS_MOCK__.length)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      console.log('[CF] getPendingCards (badge) →')
      const { data } = await callGetPendingCards({})
      console.log('[CF] getPendingCards (badge) ←', data.cards.length, 'pendentes')
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
