import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'

// ── Types ────────────────────────────────────────────────────────────────────

type TicketType = 'premium' | 'flag'
type TicketStatus = 'pending' | 'approved' | 'denied' | 'resolved'
type FilterType = 'all' | 'premium' | 'flag'
type FilterStatus = 'pending' | 'resolved'

interface Ticket {
  id: string
  type: TicketType
  uid: string
  status: TicketStatus
  createdAt: number
  // premium only
  receiptUrl?: string
  receiptType?: string
  // flag only
  questionId?: number
  comment?: string | null
}

interface FlaggedQuestion {
  id: string
  uid: string
  questionId: number
  comment?: string | null
  resolved: boolean
  createdAt: { seconds?: number; _seconds?: number } | null
}

interface PremiumRequest {
  id: string
  uid: string
  status: 'pending' | 'approved' | 'denied'
  receiptUrl: string
  receiptType?: string
  createdAt: { seconds: number } | null
  reviewedAt?: { seconds: number } | null
  reviewedBy?: string
}

// ── Callables ────────────────────────────────────────────────────────────────

const getFlaggedQuestionsFn = httpsCallable<void, FlaggedQuestion[]>(functions, 'getFlaggedQuestions')
const resolveFlaggedQuestionFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'resolveFlaggedQuestion')
const deleteFlaggedQuestionFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'deleteFlaggedQuestion')
const reviewPremiumRequestFn = httpsCallable<{ requestId: string; action: 'approve' | 'deny' }, { success: boolean }>(functions, 'reviewPremiumRequest')

// ── Helpers ───────────────────────────────────────────────────────────────────

function toEpochMs(ts: { seconds?: number; _seconds?: number } | null): number {
  if (!ts) return 0
  const secs = ts._seconds ?? ts.seconds
  return secs ? secs * 1000 : 0
}

function formatDate(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function statusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case 'pending':  return 'badge badge-yellow'
    case 'approved': return 'badge badge-green'
    case 'denied':   return 'badge badge-red'
    case 'resolved': return 'badge badge-blue'
  }
}

function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'pending':  return 'Pendente'
    case 'approved': return 'Aprovado'
    case 'denied':   return 'Negado'
    case 'resolved': return 'Resolvido'
  }
}

function mergeTickets(flags: FlaggedQuestion[], premiums: PremiumRequest[]): Ticket[] {
  const flagTickets: Ticket[] = flags.map((f) => ({
    id: f.id,
    type: 'flag',
    uid: f.uid,
    status: f.resolved ? 'resolved' : 'pending',
    createdAt: toEpochMs(f.createdAt),
    questionId: f.questionId,
    comment: f.comment,
  }))

  const premiumTickets: Ticket[] = premiums.map((p) => ({
    id: p.id,
    type: 'premium',
    uid: p.uid,
    status: p.status,
    createdAt: toEpochMs(p.createdAt),
    receiptUrl: p.receiptUrl,
    receiptType: p.receiptType,
  }))

  return [...flagTickets, ...premiumTickets].sort((a, b) => b.createdAt - a.createdAt)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')

  // premium modal
  const [premiumModal, setPremiumModal] = useState<Ticket | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [flagsRes, premiumSnap] = await Promise.all([
        getFlaggedQuestionsFn(),
        getDocs(query(collection(db, 'premium_requests'), orderBy('createdAt', 'desc'))),
      ])

      const premiums: PremiumRequest[] = premiumSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PremiumRequest, 'id'>),
      }))

      setTickets(mergeTickets(flagsRes.data, premiums))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = tickets.filter((t) => {
    const typeMatch = filterType === 'all' || t.type === filterType
    const statusMatch =
      filterStatus === 'pending'
        ? t.status === 'pending'
        : t.status !== 'pending'
    return typeMatch && statusMatch
  })

  const handleFlagResolve = async (id: string) => {
    setActioning(id)
    try { await resolveFlaggedQuestionFn({ id }); await load() } finally { setActioning(null) }
  }

  const handleFlagDelete = async (id: string) => {
    setActioning(id)
    try { await deleteFlaggedQuestionFn({ id }); await load() } finally { setActioning(null) }
  }

  const handlePremiumAction = async (id: string, action: 'approve' | 'deny') => {
    setActioning(id)
    try {
      await reviewPremiumRequestFn({ requestId: id, action })
      setPremiumModal(null)
      await load()
    } finally {
      setActioning(null)
    }
  }

  const pendingCount = tickets.filter((t) => t.status === 'pending').length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tickets</h1>
        <span className="page-meta">{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="tickets-filters">
        <div className="tickets-chip-group">
          {(['all', 'premium', 'flag'] as FilterType[]).map((v) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`tickets-chip${filterType === v ? ' tickets-chip-active' : ''}`}
            >
              {v === 'all' ? 'Todos' : v === 'premium' ? 'Premium' : 'Flags'}
            </button>
          ))}
        </div>

        <div className="tickets-chip-group">
          {(['pending', 'resolved'] as FilterStatus[]).map((v) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`tickets-chip${filterStatus === v ? ' tickets-chip-active' : ''}`}
            >
              {v === 'pending' ? 'Pendentes' : 'Resolvidos'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card"><div className="empty-state">Carregando...</div></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state">Nenhum ticket encontrado</div></div>
      ) : (
        <div className="card">
          {filtered.map((t) => (
            <div key={t.id} className="item-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`badge ${t.type === 'premium' ? 'badge-indigo' : 'badge-yellow'}`}>
                    {t.type === 'premium' ? 'Premium' : 'Flag'}
                  </span>
                  <span className={statusBadgeClass(t.status)}>{statusLabel(t.status)}</span>
                  {t.type === 'flag' && t.questionId != null && (
                    <span className="badge badge-yellow mono">#{t.questionId}</span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(t.createdAt)}</span>
                </div>
                {t.type === 'flag' && t.comment && (
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0 }}>{t.comment}</p>
                )}
                {t.type === 'premium' && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                    uid: {t.uid}
                  </p>
                )}
              </div>

              <div className="item-actions">
                {t.type === 'flag' && t.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleFlagDelete(t.id)}
                      disabled={actioning === t.id}
                      className="btn btn-danger btn-sm"
                    >
                      {actioning === t.id ? '...' : 'Deletar'}
                    </button>
                    <button
                      onClick={() => handleFlagResolve(t.id)}
                      disabled={actioning === t.id}
                      className="btn btn-primary btn-sm"
                    >
                      {actioning === t.id ? '...' : 'Resolver'}
                    </button>
                  </>
                )}
                {t.type === 'premium' && t.status === 'pending' && (
                  <button
                    onClick={() => setPremiumModal(t)}
                    className="btn btn-ghost btn-sm"
                  >
                    Ver comprovante
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium modal */}
      {premiumModal && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Pedido de Premium</h2>
              <button onClick={() => setPremiumModal(null)} className="modal-close">x</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
                uid: {premiumModal.uid}
              </p>
              {premiumModal.receiptUrl ? (
                premiumModal.receiptType === 'application/pdf' ? (
                  <iframe
                    src={premiumModal.receiptUrl}
                    title="Comprovante PDF"
                    style={{ width: '100%', height: 480, border: '1px solid var(--card-border)', borderRadius: 8 }}
                  />
                ) : (
                  <a href={premiumModal.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={premiumModal.receiptUrl}
                      alt="Comprovante de pagamento"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid var(--card-border)', display: 'block' }}
                    />
                  </a>
                )
              ) : (
                <div className="empty-state">Sem comprovante anexado</div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setPremiumModal(null)} className="btn btn-ghost">Cancelar</button>
              <button
                onClick={() => handlePremiumAction(premiumModal.id, 'deny')}
                disabled={actioning === premiumModal.id}
                className="btn btn-danger"
              >
                {actioning === premiumModal.id ? '...' : 'Negar'}
              </button>
              <button
                onClick={() => handlePremiumAction(premiumModal.id, 'approve')}
                disabled={actioning === premiumModal.id}
                className="btn btn-primary"
              >
                {actioning === premiumModal.id ? '...' : 'Aprovar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
