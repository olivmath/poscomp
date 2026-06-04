import '@material/web/progress/circular-progress.js'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { AdminDashboard } from '../types'

function fmt(n: number) { return n.toLocaleString('pt-BR') }

function fmtTime(h: number) {
  if (h < 24) return `${h.toFixed(1)}h`
  const d = Math.floor(h / 24)
  const rem = Math.round(h % 24)
  return `${d}d ${rem}h`
}

function toDate(val: AdminDashboard['computedAt']): Date {
  if (typeof val === 'string') return new Date(val)
  if (val && typeof (val as { toDate?: unknown }).toDate === 'function') return (val as { toDate(): Date }).toDate()
  // Firestore Timestamp serializado pela Callable: { _seconds, _nanoseconds } ou { seconds, nanoseconds }
  const v = val as Record<string, number>
  if (v._seconds != null) return new Date(v._seconds * 1000)
  if (v.seconds != null) return new Date(v.seconds * 1000)
  return new Date()
}

function fmtComputedAt(val: AdminDashboard['computedAt']): { label: string; stale: boolean } {
  const date = toDate(val)
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000)
  const stale = diffMin > 30
  const label = diffMin < 60 ? `Atualizado há ${diffMin}min` : `Atualizado às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return { label, stale }
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="progress-bar-row">
      <span className="progress-bar-label">{label}</span>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar-pct">{fmt(value)} <span className="text-muted">({pct}%)</span></span>
    </div>
  )
}

function RetentionBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="progress-bar-row">
      <span className="progress-bar-label" style={{ minWidth: 28 }}>{label}</span>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar-pct">{pct}%</span>
    </div>
  )
}

export function Dashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<Record<string, never>, AdminDashboard>(functions, 'getAdminDashboard')
      const res = await fn({})
      setData(res.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading && !data) {
    return (
      <>
        <div className="page-header"><h1 className="page-title">Dashboard</h1></div>
        <div className="kpi-grid">
          {[1,2,3,4].map(i => <div key={i} className="kpi-card skeleton" style={{ height: 80 }} />)}
        </div>
        <div className="grid-2">
          <div className="card skeleton" style={{ height: 120 }} />
          <div className="card skeleton" style={{ height: 120 }} />
        </div>
        <div className="card skeleton" style={{ height: 80 }} />
      </>
    )
  }

  const computedLabel = data ? fmtComputedAt(data.computedAt) : null
  const totalPlan = data ? data.usersByPlan.free + data.usersByPlan.pro + data.usersByPlan.pro_max : 0

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="gap-row">
          {computedLabel && (
            <>
              <span className="timestamp-row">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                {computedLabel.label}
              </span>
              {computedLabel.stale && <span className="badge-stale">Dados desatualizados</span>}
            </>
          )}
          <button
            onClick={load}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--md-sys-color-primary)', fontSize: 13 }}
          >
            {loading
              ? <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '18px' } as React.CSSProperties} />
              : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>}
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
          <button onClick={load} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}>Tentar novamente</button>
        </div>
      )}

      {data && (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-value">{fmt(data.totalUsers)}</div>
              <div className="kpi-label">Usuários total</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{fmt(data.dau)}</div>
              <div className="kpi-label">DAU</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{fmt(data.wau)}</div>
              <div className="kpi-label">WAU</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{fmt(data.mau)}</div>
              <div className="kpi-label">MAU</div>
            </div>
          </div>

          {/* Planos + Retenção */}
          <div className="grid-2 section-gap">
            <div className="card">
              <div className="card-title">Planos</div>
              <Bar label="Free" value={data.usersByPlan.free} max={totalPlan} />
              <Bar label="Pro" value={data.usersByPlan.pro} max={totalPlan} />
              <Bar label="Pro MAX" value={data.usersByPlan.pro_max} max={totalPlan} />
            </div>
            <div className="card">
              <div className="card-title">Retenção (cohort 30d)</div>
              <RetentionBar label="D1" pct={Math.round(data.retention.d1)} />
              <RetentionBar label="D7" pct={Math.round(data.retention.d7)} />
              <RetentionBar label="D30" pct={Math.round(data.retention.d30)} />
            </div>
          </div>

          {/* Funil Premium */}
          <div className="card section-gap">
            <div className="card-title">Funil Premium</div>
            <div className="gap-row" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>Tickets: <strong>{fmt(data.premiumFunnel.total)}</strong></span>
              <span
                className="badge badge-approved"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/premium?status=approved')}
              >
                Aprovados: {data.premiumFunnel.approved}
              </span>
              <span
                className="badge badge-denied"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/premium?status=denied')}
              >
                Negados: {data.premiumFunnel.denied}
              </span>
              <span
                className="badge badge-pending"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/premium?status=pending')}
              >
                Pendentes: {data.premiumFunnel.pending}
              </span>
            </div>
            <div className="gap-row text-muted" style={{ fontSize: 13 }}>
              <span>Taxa de aprovação: <strong>{Math.round(data.premiumFunnel.approvalRatePct)}%</strong></span>
              <span>·</span>
              <span>Tempo médio: <strong>{fmtTime(data.premiumFunnel.avgApprovalTimeHours)}</strong></span>
            </div>
          </div>

          {/* Churn Risk */}
          <div className="card">
            <div className="card-title">Churn Risk</div>
            <div className="churn-row">
              <span>Expira em 7 dias</span>
              <div className="gap-row">
                <span className="churn-count">{data.premiumExpiringIn7Days}</span>
                <button
                  onClick={() => navigate('/usuarios?filter=expiring7')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontSize: 12, fontWeight: 600 }}
                >
                  Ver lista
                </button>
              </div>
            </div>
            <div className="churn-row">
              <span>Expira em 30 dias</span>
              <div className="gap-row">
                <span className="churn-count">{data.premiumExpiringIn30Days}</span>
                <button
                  onClick={() => navigate('/usuarios?filter=expiring30')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontSize: 12, fontWeight: 600 }}
                >
                  Ver lista
                </button>
              </div>
            </div>
            <div className="churn-row">
              <span>Churn confirmado</span>
              <div className="gap-row">
                <span className="churn-count">{data.expiredPremium}</span>
                <button
                  onClick={() => navigate('/usuarios?filter=expired')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontSize: 12, fontWeight: 600 }}
                >
                  Ver lista
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
