import { ModalOverlay } from './ModalOverlay'

const PRIVACY_TEXT = `# Política de Privacidade

**Última atualização:** Janeiro de 2025

## Dados Coletados
Coletamos seu e-mail, nome e foto do perfil do Google para autenticação. Armazenamos seus resultados de simulados e progresso de revisão no Firebase Firestore.

## Uso dos Dados
Os dados são usados exclusivamente para fornecer o serviço POSCOMP App: histórico de simulados, revisão espaçada e estatísticas de desempenho.

## Compartilhamento
Não compartilhamos seus dados com terceiros, exceto o Firebase (Google LLC) como provedor de infraestrutura.

## Retenção
Seus dados são retidos enquanto sua conta estiver ativa. Você pode solicitar a exclusão a qualquer momento pelo app.

## Contato
contato@poscomp.app`

const TERMS_TEXT = `# Termos de Uso

**Última atualização:** Janeiro de 2025

## Aceitação
Ao usar o POSCOMP App, você concorda com estes termos.

## Uso Permitido
O app destina-se ao estudo pessoal para o exame POSCOMP. É proibido o uso automatizado, scraping ou redistribuição do conteúdo.

## Plano Premium
O plano Premium é ativado manualmente após confirmação do pagamento via PIX. O acesso é válido pelo período contratado.

## Limitação de Responsabilidade
O conteúdo do app é fornecido "como está". Não garantimos aprovação no exame POSCOMP.

## Modificações
Reservamo-nos o direito de alterar estes termos com aviso prévio de 7 dias.`

interface LegalModalProps {
  type: 'privacy' | 'terms'
  onClose: () => void
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  const content = type === 'privacy' ? PRIVACY_TEXT : TERMS_TEXT
  const title = type === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'

  return (
    <ModalOverlay onBackdropClick={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--md-sys-color-on-surface-variant)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    </ModalOverlay>
  )
}
