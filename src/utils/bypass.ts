/**
 * Check if authentication bypass is enabled for development/testing.
 * Allows:
 * - VITE_AUTH_BYPASS=true in .env (forced bypass)
 * - window.__AUTH_BYPASS__ injected by E2E tests (in dev/test modes)
 */
export function isAuthBypassed(): boolean {
  const isDevOrTest = import.meta.env.MODE !== 'production'
  return (
    import.meta.env.VITE_AUTH_BYPASS === 'true' ||
    (isDevOrTest && typeof window !== 'undefined' && window.__AUTH_BYPASS__ === true)
  )
}
