import { useState, useCallback } from 'react'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import { functions } from '../firebase'

export function useFn<TIn = unknown, TOut = unknown>(name: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const call = useCallback(async (data?: TIn): Promise<TOut | null> => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<TIn, TOut>(functions, name)
      const result: HttpsCallableResult<TOut> = await fn(data as TIn)
      return result.data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [name])

  return { call, loading, error, clearError: () => setError(null) }
}
