import '@material/web/progress/circular-progress.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { PremiumRequest, PremiumStatus } from '../types'

interface GetRequestsResponse { requests: PremiumRequest[] }

const STATUS_LABELS: Record<PremiumStatus, string> = {
  awaiting_receipt: 'Aguardando',
  pending: 'Pendente',
  approved: 'Aprovado',
  denied: 'Negado',
}

const PLAN_LABELS = { pro: 'Pro (R$10/mês — 30 dias)', pro_max: 'Pro MAX (R$5/mês — 1 ano)', free: 'Free' }

export function Premium({ onBadgeChange }: { onBadgeChange?: (n: number) => void }) {
  const [searchParams] = useSearchParams()
  const [requests, setRequests] = useState<PremiumRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<PremiumStatus | 'all'>((searchParams.get('status') as PremiumStatus | null) ?? 'pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<Record<string, never>, GetRequestsResponse>(functions, 'listPremiumRequests')
      const res = await fn({})
      setRequests(res.data.requests ?? [])
      onBadgeChange?.((res.data.requests ?? []).filter(r => r.status === 'pending').length)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }, [onBadgeChange])

  useEffect(() => { load() }, [load])

  async function review(requestId: string, action: 'approve' | 'deny') {
    setActing(requestId)
    setError(null)
    try {
      const fn = httpsCallable(functions, 'reviewPremiumRequest')
      await fn({ requestId, action })
      const newStatus: PremiumStatus = action === 'approve' ? 'approved' : 'denied'
      setRequests(rs => rs.map(r => r.id === requestId ? { ...r, status: newStatus } : r))
      onBadgeChange?.(requests.filter(r => r.status === 'pending' && r.id !== requestId).length)
      setExpanded(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Erro ao ${action === 'approve' ? 'aprovar' : 'negar'}`)
    } finally {
      setActing(null)
    }
  }

  const displayed = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Solicitações Premium
          {pendingCount > 0 && <span className="badge badge-pending" style={{ marginLeft: 10, fontSize: 13 }}>{pendingCount} pendentes</span>}
        </h1>
      </div>

      {error && (
        <div className="error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      <div className="toolbar">
        {(['all', 'pending', 'approved', 'denied'] as const).map(s => (
          <button
            key={s}
            className={`badge ${filter === s ? (s === 'pending' ? 'badge-pending' : s === 'approved' ? 'badge-approved' : s === 'denied' ? 'badge-denied' : 'badge-admin') : 'badge-free'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontSize: 13 }}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Todos' : STATUS_LABELS[s as PremiumStatus]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><md-circular-progress indeterminate /><span>Carregando...</span></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>UID</th>
                <th>Plano</th>
                <th>Enviado em</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(req => (
                <>
                  <tr
                    key={req.id}
                    className="expandable"
                    onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                  >
                    <td>
                      <code style={{ fontSize: 12 }}>{req.uid.slice(0, 12)}…</code>
                    </td>
                    <td>
                      <span className={`badge badge-${req.planType}`}>
                        {req.planType === 'pro_max' ? 'Pro MAX' : req.planType === 'pro' ? 'Pro' : 'Free'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${req.status === 'pending' ? 'pending' : req.status === 'approved' ? 'approved' : 'denied'}`}>
                        {STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {req.status === 'pending' && (
                        <div className="gap-row">
                          <button
                            onClick={() => review(req.id, 'approve')}
                            disabled={acting === req.id}
                            style={{ background: 'var(--color-score-high-bg)', color: 'var(--color-score-high)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                          >
                            {acting === req.id ? '...' : 'Aprovar'}
                          </button>
                          <button
                            onClick={() => review(req.id, 'deny')}
                            disabled={acting === req.id}
                            style={{ background: 'var(--color-score-low-bg)', color: 'var(--color-score-low)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                          >
                            Negar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expanded === req.id && (
                    <tr key={`${req.id}-expand`} className="expand-row">
                      <td colSpan={5}>
                        <div className="expand-content">
                          <div className="form-grid" style={{ gap: 10 }}>
                            <div><span className="text-muted" style={{ fontSize: 12 }}>UID:</span> <code style={{ fontSize: 12 }}>{req.uid}</code></div>
                            <div><span className="text-muted" style={{ fontSize: 12 }}>Plano:</span> <strong>{PLAN_LABELS[req.planType]}</strong></div>
                            <div><span className="text-muted" style={{ fontSize: 12 }}>Enviado em:</span> {req.submittedAt ? new Date(req.submittedAt).toLocaleString('pt-BR') : '—'}</div>
                            {req.receiptType && <div><span className="text-muted" style={{ fontSize: 12 }}>Tipo do arquivo:</span> {req.receiptType}</div>}
                            {req.storagePath && (
                              <div>
                                <a
                                  href={`https://storage.googleapis.com/${req.storagePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600, fontSize: 13 }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>open_in_new</span>
                                  Visualizar comprovante
                                </a>
                              </div>
                            )}
                            {req.status === 'pending' && (
                              <div className="gap-row" style={{ marginTop: 8 }}>
                                <md-filled-button
                                  onClick={() => review(req.id, 'approve')}
                                  {...(acting === req.id ? { disabled: true } : {})}
                                >
                                  {acting === req.id ? 'Processando...' : 'Aprovar'}
                                </md-filled-button>
                                <md-outlined-button
                                  onClick={() => review(req.id, 'deny')}
                                  {...(acting === req.id ? { disabled: true } : {})}
                                  style={{ '--md-outlined-button-label-text-color': 'var(--md-sys-color-error)', '--md-outlined-button-outline-color': 'var(--md-sys-color-error)' } as React.CSSProperties}
                                >
                                  Negar
                                </md-outlined-button>
                              </div>
                            )}
                            {req.reviewedAt && (
                              <div className="text-muted" style={{ fontSize: 12 }}>
                                Revisado em: {new Date(req.reviewedAt).toLocaleString('pt-BR')}
                                {req.reviewedBy && ` por ${req.reviewedBy}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Nenhuma solicitação {filter !== 'all' ? STATUS_LABELS[filter as PremiumStatus].toLowerCase() : ''}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
