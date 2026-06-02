import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    questions: 0,
    tickets: 0,
    activeBanners: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersSnap, questionsSnap, ticketsSnap, bannersSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'questions')),
          getDocs(collection(db, 'premium_requests')),
          getDocs(collection(db, 'announcements')),
        ])
        
        setStats({
          users: usersSnap.size,
          questions: questionsSnap.size,
          tickets: ticketsSnap.docs.filter(d => d.data().status === 'pending').length,
          activeBanners: bannersSnap.docs.filter(d => d.data().active).length
        })
      } catch (e) {
        console.error('Erro ao carregar stats:', e)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const cards = [
    { label: 'Usuários Totais', value: stats.users, icon: 'group', color: 'primary' },
    { label: 'Questões no Banco', value: stats.questions, icon: 'quiz', color: 'secondary' },
    { label: 'Tickets Pendentes', value: stats.tickets, icon: 'confirmation_number', color: 'error' },
    { label: 'Banners Ativos', value: stats.activeBanners, icon: 'campaign', color: 'tertiary' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Controle</h1>
          <p className="page-meta">Visão geral do sistema POSCOMP</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', animation: 'spin 2s linear infinite' }}>sync</span>
          <p>Compilando estatísticas...</p>
        </div>
      ) : (
        <div className="responsive-grid">
          {cards.map((c) => (
            <div key={c.label} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: `var(--md-sys-color-${c.color}-container)`,
                color: `var(--md-sys-color-on-${c.color}-container)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined">{c.icon}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>{c.label}</p>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>{c.value}</h2>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '48px' }}>
        <h2 className="section-label">Acesso Rápido</h2>
        <div className="responsive-grid">
          <a href="/questoes" className="card" style={{ padding: '24px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>edit_note</span>
            <span style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>Gerenciar Banco de Questões</span>
          </a>
          <a href="/tickets" className="card" style={{ padding: '24px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>rule</span>
            <span style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>Revisar Pendências</span>
          </a>
        </div>
      </div>
    </div>
  )
}
