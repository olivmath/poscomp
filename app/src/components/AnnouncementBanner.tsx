import { useState, useEffect } from 'react'
import { onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '../firebase'

interface Announcement {
  id: string
  message: string
  type: 'info' | 'warning' | 'success'
  active: boolean
  url: string
  expiresAt: { toDate(): Date } | null
}

const BG: Record<string, string> = {
  info: 'var(--md-sys-color-secondary-container)',
  warning: 'var(--color-warning-bg)',
  success: 'var(--color-score-high-bg)',
}

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const q = query(collection(db, 'announcements'), where('active', '==', true))
    const unsub = onSnapshot(q, (snap) => {
      const now = new Date()
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]') as string[]
      const active = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Announcement))
        .filter((a) => !dismissed.includes(a.id) && (!a.expiresAt || a.expiresAt.toDate() > now))
      setItems(active)
    })
    return unsub
  }, [])

  if (items.length === 0) return null

  const item = items[idx]
  if (!item) return null

  function dismiss() {
    const current = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]') as string[]
    localStorage.setItem('dismissed_announcements', JSON.stringify([...current, item.id]))
    const remaining = items.filter((a) => a.id !== item.id)
    setItems(remaining)
    setIdx(0)
  }

  return (
    <div
      style={{
        background: BG[item.type] ?? BG.info,
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
        {item.type === 'warning' ? 'warning' : item.type === 'success' ? 'check_circle' : 'info'}
      </span>
      <div style={{ flex: 1, fontSize: 14 }}>
        {item.url ? (
          <a href={item.url} style={{ color: 'inherit' }}>{item.message}</a>
        ) : (
          <span>{item.message}</span>
        )}
        {items.length > 1 && (
          <span style={{ fontSize: 12, marginLeft: 8, opacity: 0.7 }}>
            {idx + 1}/{items.length}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {items.length > 1 && (
          <button
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Próximo"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        )}
        <button
          onClick={dismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
    </div>
  )
}
