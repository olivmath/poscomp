import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { WeekHeader } from '../components/WeekHeader'
import { AnalysisPanel } from '../components/AnalysisPanel'
import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { HistoricoResult } from '../types'

function calcStreak(activeDays: string[]): number {
  const set = new Set(activeDays)
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (set.has(key)) streak++
    else break
  }
  return streak
}

export function Home() {
  const navigate = useNavigate()
  const { user, userDoc } = useAuth()
  const [results, setResults] = useState<HistoricoResult[]>([])
  const [loadingResults, setLoadingResults] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'results'),
      orderBy('completedAt', 'desc'),
      limit(10)
    )
    getDocs(q)
      .then((snap) => setResults(snap.docs.map((d) => ({ resultId: d.id, ...d.data() } as HistoricoResult))))
      .finally(() => setLoadingResults(false))
  }, [user])

  return (
    <div>
      <div className="page-shell section-stack" style={{ paddingTop: 16 }}>
        <AnnouncementBanner />

        <WeekHeader activeDays={userDoc?.activeDays ?? []} streak={calcStreak(userDoc?.activeDays ?? [])} />

        <AnalysisPanel results={results} loading={loadingResults} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navigate('/simulado/config')}
            style={{
              padding: '14px 0',
              border: '1px solid var(--md-sys-color-primary)',
              borderRadius: 8,
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--md-sys-color-primary)',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Simulado customizado
          </button>
          <button
            onClick={() => navigate('/simulado/running', { state: { config: { materias: [], total: 5, timerMode: 'none' } } })}
            style={{
              padding: '14px 0',
              border: 'none',
              borderRadius: 8,
              background: 'var(--md-sys-color-primary)',
              cursor: 'pointer',
              color: 'var(--md-sys-color-on-primary)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Começar Simulado
          </button>
        </div>
      </div>
    </div>
  )
}
