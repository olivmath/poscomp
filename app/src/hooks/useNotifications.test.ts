import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// --- mocks ---
const mockGetDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockOnMessage = vi.fn(() => () => {})
const mockGetToken = vi.fn()
const mockDeleteToken = vi.fn()
const mockGetMessaging = vi.fn(() => ({}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _col, id) => ({ id })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  arrayUnion: (v: unknown) => ({ __union: v }),
  arrayRemove: (v: unknown) => ({ __remove: v }),
}))

vi.mock('firebase/messaging', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMessaging: (...args: any[]) => mockGetMessaging(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getToken: (...args: any[]) => mockGetToken(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage: (...args: any[]) => mockOnMessage(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteToken: (...args: any[]) => mockDeleteToken(...args),
}))

vi.mock('../firebase', () => ({
  app: {},
  db: {},
}))

vi.mock('../contexts/AuthContext', () => {
  const user = { uid: 'user-123' }
  return { useAuth: () => ({ user }) }
})

// stub Notification API
const requestPermissionMock = vi.fn()
Object.defineProperty(window, 'Notification', {
  value: class {
    static permission: NotificationPermission = 'default'
    static requestPermission = requestPermissionMock
    constructor() {}
  },
  writable: true,
})

Object.defineProperty(navigator, 'serviceWorker', {
  value: { register: vi.fn() },
  writable: true,
})

import { useNotifications } from './useNotifications'

describe('useNotifications', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FIREBASE_VAPID_KEY', 'test-vapid-key')
    vi.clearAllMocks()
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ notificationsEnabled: false }) })
    mockUpdateDoc.mockResolvedValue(undefined)
    mockGetToken.mockResolvedValue('fcm-token-abc')
    mockDeleteToken.mockResolvedValue(true)
    requestPermissionMock.mockResolvedValue('granted')
    ;(window.Notification as unknown as { permission: string }).permission = 'default'
  })

  it('começa com enabled=false quando Firestore retorna notificationsEnabled: false', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.enabled).toBe(false)
  })

  it('toggle: pede permissão, obtém token e salva no Firestore', async () => {
    requestPermissionMock.mockResolvedValue('granted')
    ;(window.Notification as unknown as { permission: string }).permission = 'granted'

    const { result } = renderHook(() => useNotifications())
    await act(async () => {})

    await act(async () => { await result.current.toggle() })

    expect(requestPermissionMock).toHaveBeenCalledOnce()
    expect(mockGetToken).toHaveBeenCalledOnce()
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ notificationsEnabled: true }),
    )
    expect(result.current.enabled).toBe(true)
  })

  it('toggle: não salva token se permissão for negada', async () => {
    requestPermissionMock.mockResolvedValue('denied')

    const { result } = renderHook(() => useNotifications())
    await act(async () => {})

    await act(async () => { await result.current.toggle() })

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
    expect(result.current.enabled).toBe(false)
  })

  it('toggle: desativa, remove token do Firestore e chama deleteToken', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ notificationsEnabled: true }) })

    const { result } = renderHook(() => useNotifications())
    await act(async () => {})

    await act(async () => { await result.current.toggle() })

    expect(mockDeleteToken).toHaveBeenCalledOnce()
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ notificationsEnabled: false }),
    )
    expect(result.current.enabled).toBe(false)
  })
})
