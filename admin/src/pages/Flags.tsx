import '@material/web/progress/circular-progress.js'
import '@material/web/button/filled-button.js'
import { useState, useEffect, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { FlaggedQuestion } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface GetFlagsResponse { flags: FlaggedQuestion[] }

export function Flags({ onBadgeChange }: { onBadgeChange?: (n: number) => void }) {
  const [flags, setFlags] = useState<FlaggedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FlaggedQuestion | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<Record<string, never>, GetFlagsResponse>(functions, 'getFlaggedQuestions')
      const res = await fn({})
      setFlags(res.data.flags ?? [])
      onBadgeChange?.((res.data.flags ?? []).filter(f => !f.resolved).length)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar reports')
    } finally {
      setLoading(false)
    }
  }, [onBadgeChange])

  useEffect(() => { load() }, [load])

  async function resolve(flag: FlaggedQuestion) {
    try {
      const fn = httpsCallable(functions, 'resolveFlaggedQuestion')
      await fn({ id: flag.id })
      setFlags(fs => fs.map(f => f.id === flag.id ? { ...f, resolved: true } : f))
      onBadgeChange?.(flags.filter(f => !f.resolved && f.id !== flag.id).length)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao resolver report')
    }
  }

  async function deleteFlag() {
    if (!deleteTarget) return
    try {
      const fn = httpsCallable(functions, 'deleteFlaggedQuestion')
      await fn({ id: deleteTarget.id })
      const updated = flags.filter(f => f.id !== deleteTarget.id)
      setFlags(updated)
      onBadgeChange?.(updated.filter(f => !f.resolved).length)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar report')
    } finally {
      setDeleteTarget(null)
    }
  }

  const displayed = flags.filter(f => filter === 'pending' ? !f.resolved : f.resolved)

  return (
    <>
      <div className="page-header"><h1 className="page-title">Reports</h1></div>

      {error && (
        <div className="error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      <div className="toolbar">
        <button
          className={`badge ${filter === 'pending' ? 'badge-pending' : 'badge-free'}`}
          style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontSize: 13 }}
          onClick={() => setFilter('pending')}
        >
          Pendentes ({flags.filter(f => !f.resolved).length})
        </button>
        <button
          className={`badge ${filter === 'resolved' ? 'badge-approved' : 'badge-free'}`}
          style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontSize: 13 }}
          onClick={() => setFilter('resolved')}
        >
          Resolvidos ({flags.filter(f => f.resolved).length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><md-circular-progress indeterminate /><span>Carregando...</span></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Q#</th>
                <th>Comentário do usuário</th>
                <th style={{ width: 100 }}>Data</th>
                <th style={{ width: 120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(flag => (
                <>
                  <tr
                    key={flag.id}
                    className="expandable"
                    onClick={() => setExpanded(expanded === flag.id ? null : flag.id)}
                  >
                    <td className="text-muted">#{flag.questionId}</td>
                    <td className="td-truncate">{flag.comment || '(sem comentário)'}</td>
                    <td className="text-muted">{flag.createdAt ? new Date(flag.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="gap-row">
                        {!flag.resolved && (
                          <button
                            onClick={() => resolve(flag)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-score-high)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                            title="Marcar resolvido"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(flag)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-score-low)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                          title="Deletar report"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === flag.id && (
                    <tr key={`${flag.id}-expand`} className="expand-row">
                      <td colSpan={4}>
                        <div className="expand-content">
                          <div className="gap-row" style={{ marginBottom: 8 }}>
                            <span className="text-muted" style={{ fontSize: 12 }}>UID:</span>
                            <code style={{ fontSize: 12, background: 'var(--md-sys-color-surface-container-highest)', padding: '2px 6px', borderRadius: 4 }}>{flag.uid}</code>
                          </div>
                          {flag.resultId && (
                            <div className="gap-row" style={{ marginBottom: 8 }}>
                              <span className="text-muted" style={{ fontSize: 12 }}>Simulado:</span>
                              <code style={{ fontSize: 12, background: 'var(--md-sys-color-surface-container-highest)', padding: '2px 6px', borderRadius: 4 }}>{flag.resultId}</code>
                            </div>
                          )}
                          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                            <strong>Comentário completo:</strong> {flag.comment || '(sem comentário)'}
                          </div>
                          {flag.resolved && flag.resolvedAt && (
                            <div className="gap-row" style={{ marginTop: 8 }}>
                              <span className="badge badge-approved">Resolvido</span>
                              <span className="text-muted" style={{ fontSize: 12 }}>{new Date(flag.resolvedAt).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {filter === 'pending' ? 'Nenhum report pendente' : 'Nenhum report resolvido'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Deletar report"
          body={`Deletar o report da questão #${deleteTarget.questionId}?`}
          confirmLabel="Deletar"
          danger
          onConfirm={deleteFlag}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
