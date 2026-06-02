import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import { ConfirmDialog } from '../components/ConfirmDialog'

type TicketType = 'premium' | 'flag'
type TicketStatus = 'pending' | 'approved' | 'denied' | 'resolved'
type FilterType = 'all' | 'premium' | 'flag'
type FilterStatus = 'pending' | 'resolved'

interface Ticket {
  id: string; type: TicketType; uid: string; status: TicketStatus; createdAt: number;
  receiptUrl?: string; receiptType?: string; questionId?: number; comment?: string | null;
  planType?: 'pro' | 'pro_max';
}

interface FlaggedQuestion {
  id: string; uid: string; questionId: number; comment?: string | null; resolved: boolean;
  createdAt: { seconds?: number; _seconds?: number } | null;
}

interface PremiumRequest {
  id: string; uid: string; status: 'pending' | 'approved' | 'denied'; receiptUrl: string;
  receiptType?: string; createdAt: { seconds: number } | null; planType?: 'pro' | 'pro_max';
}

const getFlaggedQuestionsFn = httpsCallable<void, FlaggedQuestion[]>(functions, 'getFlaggedQuestions')
const resolveFlaggedQuestionFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'resolveFlaggedQuestion')
const deleteFlaggedQuestionFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'deleteFlaggedQuestion')
const reviewPremiumRequestFn = httpsCallable<{ requestId: string; action: 'approve' | 'deny' }, { success: boolean }>(functions, 'reviewPremiumRequest')

function toEpochMs(ts: { seconds?: number; _seconds?: number } | null): number {
  if (!ts) return 0
  const secs = ts._seconds ?? ts.seconds
  return secs ? secs * 1000 : 0
}

function formatDate(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case 'pending':  return 'badge badge-yellow'
    case 'approved': return 'badge badge-green'
    case 'denied':   return 'badge badge-red'
    case 'resolved': return 'badge badge-indigo'
    default: return 'badge'
  }
}

function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'pending': return 'Pendente'; case 'approved': return 'Aprovado'; case 'denied': return 'Negado'; case 'resolved': return 'Resolvido'; default: return status;
  }
}

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')
  const [premiumModal, setPremiumModal] = useState<Ticket | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'primary' | 'danger'; confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const load = async () => {
    setLoading(true)
    try {
      const [flagsRes, premiumSnap] = await Promise.all([
        getFlaggedQuestionsFn(),
        getDocs(query(collection(db, 'premium_requests'), orderBy('createdAt', 'desc'))),
      ])
      const premiums: PremiumRequest[] = premiumSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PremiumRequest, 'id'>) }))
      const flagTickets: Ticket[] = flagsRes.data.map(f => ({ id: f.id, type: 'flag', uid: f.uid, status: f.resolved ? 'resolved' : 'pending', createdAt: toEpochMs(f.createdAt), questionId: f.questionId, comment: f.comment }))
      const premiumTickets: Ticket[] = premiums.map(p => ({ id: p.id, type: 'premium', uid: p.uid, status: p.status, createdAt: toEpochMs(p.createdAt), receiptUrl: p.receiptUrl, receiptType: p.receiptType, planType: p.planType }))
      setTickets([...flagTickets, ...premiumTickets].sort((a, b) => b.createdAt - a.createdAt))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = tickets.filter(t => (filterType === 'all' || t.type === filterType) && (filterStatus === 'pending' ? t.status === 'pending' : t.status !== 'pending'))

  const handleFlagResolve = (id: string) => {
    setConfirmConfig({
      isOpen: true, title: 'Resolver Reporte', message: 'Confirmar que esta questão foi revisada e corrigida?', confirmLabel: 'Marcar Resolvido',
      onConfirm: async () => { setActioning(id); setConfirmConfig(p => ({ ...p, isOpen: false })); try { await resolveFlaggedQuestionFn({ id }); await load() } finally { setActioning(null) } }
    })
  }

  const handleFlagDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true, title: 'Excluir Alerta', message: 'Deseja remover este ticket? A questão permanecerá no banco.', type: 'danger', confirmLabel: 'Excluir Ticket',
      onConfirm: async () => { setActioning(id); setConfirmConfig(p => ({ ...p, isOpen: false })); try { await deleteFlaggedQuestionFn({ id }); await load() } finally { setActioning(null) } }
    })
  }

  const handlePremiumAction = (id: string, action: 'approve' | 'deny') => {
    setConfirmConfig({
      isOpen: true, title: action === 'approve' ? 'Aprovar Premium' : 'Negar Premium', message: action === 'approve' ? 'Liberar acesso total ao usuário?' : 'Recusar solicitação de upgrade?', type: action === 'approve' ? 'primary' : 'danger', confirmLabel: action === 'approve' ? 'Aprovar' : 'Negar',
      onConfirm: async () => { setActioning(id); setConfirmConfig(p => ({ ...p, isOpen: false })); try { await reviewPremiumRequestFn({ requestId: id, action }); setPremiumModal(null); await load() } finally { setActioning(null) } }
    })
  }

  const pendingCount = tickets.filter(t => t.status === 'pending').length

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Fila de Tickets</h1><p className="page-meta">{pendingCount} itens pendentes de revisão</p></div>
        <button onClick={load} className="btn btn-ghost" title="Sincronizar dados"><span className="material-symbols-outlined">refresh</span><span className="mobile-hide">Atualizar</span></button>
      </div>

      <div className="tickets-filters" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="section-label" style={{ margin: 0 }}>Tipo</span>
          <div className="tickets-chip-group">{(['all', 'premium', 'flag'] as FilterType[]).map(v => (
            <button key={v} onClick={() => setFilterType(v)} className={`tickets-chip${filterType === v ? ' tickets-chip-active' : ''}`}>{v === 'all' ? 'Todos' : v === 'premium' ? 'Premium' : 'Reportes'}</button>
          ))}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="section-label" style={{ margin: 0 }}>Status</span>
          <div className="tickets-chip-group">{(['pending', 'resolved'] as FilterStatus[]).map(v => (
            <button key={v} onClick={() => setFilterStatus(v)} className={`tickets-chip${filterStatus === v ? ' tickets-chip-active' : ''}`}>{v === 'pending' ? 'Pendentes' : 'Concluídos'}</button>
          ))}</div>
        </div>
      </div>

      {loading ? (<div className="empty-state"><span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>sync</span><p>Buscando fila...</p></div>
      ) : filtered.length === 0 ? (<div className="empty-state"><span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>check_circle</span><p>Tudo em dia!</p></div>
      ) : (
        <div className="card">
          {filtered.map(t => (
            <div key={t.id} className="item-row">
              <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: t.type === 'premium' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-tertiary-container)', color: t.type === 'premium' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined">{t.type === 'premium' ? 'workspace_premium' : 'report'}</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{t.type === 'premium' ? 'Solicitação de Premium' : `Reporte Questão #${t.questionId}`}</span>
                    <span className={statusBadgeClass(t.status)}>{statusLabel(t.status)}</span>
                    {t.type === 'premium' && (t.planType === 'pro_max' ? <span className="badge badge-indigo">Pro MAX</span> : <span className="badge" style={{ background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}>Pro</span>)}
                  </div>
                  {t.type === 'flag' && t.comment && <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface)', margin: '4px 0 8px' }}>"{t.comment}"</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>{formatDate(t.createdAt)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span><span className="mono">UID: {t.uid.slice(0, 8)}...</span></span>
                  </div>
                </div>
              </div>
              <div className="item-actions">
                {t.type === 'flag' && t.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleFlagDelete(t.id)} disabled={actioning === t.id} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-error)' }} title="Excluir ticket"><span className="material-symbols-outlined">delete</span><span className="mobile-hide">Excluir</span></button>
                    <button onClick={() => handleFlagResolve(t.id)} disabled={actioning === t.id} className="btn btn-primary" title="Marcar resolvido"><span className="material-symbols-outlined">done_all</span><span className="mobile-hide">Resolver</span></button>
                  </div>
                )}
                {t.type === 'premium' && t.status === 'pending' && (
                  <button onClick={() => setPremiumModal(t)} className="btn btn-primary" title="Analisar comprovante"><span className="material-symbols-outlined">visibility</span><span>Analisar</span></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {premiumModal && (
        <div className="modal-backdrop" onClick={() => setPremiumModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Revisão de Pagamento</h2></div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--md-sys-color-surface-container)', borderRadius: '12px', fontSize: '13px' }}>
                <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}><strong>Usuário:</strong> <span className="mono">{premiumModal.uid}</span></p>
                <p style={{ margin: '4px 0 0', color: 'var(--md-sys-color-on-surface-variant)' }}><strong>Solicitado em:</strong> {formatDate(premiumModal.createdAt)}</p>
                <p style={{ margin: '4px 0 0', color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>Plano solicitado:</strong>
                  {premiumModal.planType === 'pro_max' ? <span className="badge badge-indigo">Pro MAX</span> : <span className="badge" style={{ background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}>Pro</span>}
                </p>
              </div>
              <div style={{ background: 'var(--md-sys-color-surface-variant)', borderRadius: '16px', overflow: 'hidden', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {premiumModal.receiptUrl ? (
                  premiumModal.receiptType === 'application/pdf' ? <iframe src={premiumModal.receiptUrl} title="PDF" style={{ width: '100%', height: '500px', border: 'none' }} /> : <a href={premiumModal.receiptUrl} target="_blank" rel="noopener noreferrer"><img src={premiumModal.receiptUrl} alt="Recibo" style={{ width: '100%', height: 'auto', display: 'block' }} /></a>
                ) : <div className="empty-state">Sem comprovante</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setPremiumModal(null)} className="btn btn-ghost">Fechar</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => handlePremiumAction(premiumModal.id, 'deny')} disabled={actioning === premiumModal.id} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-error)' }}>Negar Pedido</button>
              <button onClick={() => handlePremiumAction(premiumModal.id, 'approve')} disabled={actioning === premiumModal.id} className="btn btn-primary">{premiumModal.planType === 'pro_max' ? 'Aprovar Pro MAX' : 'Aprovar Pro'}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} loading={actioning !== null} />
    </div>
  )
}
