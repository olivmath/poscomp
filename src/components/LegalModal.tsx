import '@material/web/button/text-button.js'
import { ModalOverlay } from './ModalOverlay'

const PRIVACY_POLICY = `**Política de Privacidade**
Última atualização: junho de 2025

**1. Dados coletados**
Coletamos apenas o necessário para o funcionamento do app:
- Nome e e-mail fornecidos via login com Google
- Foto de perfil (opcional, fornecida pelo Google)
- Histórico de simulados e cartões de revisão espaçada

**2. Finalidade**
Os dados são usados exclusivamente para:
- Autenticar o usuário
- Armazenar e sincronizar seu progresso de estudos entre dispositivos

**3. Armazenamento**
Todos os dados ficam no Firebase (Google Cloud), protegidos por regras de segurança do Firestore que impedem acesso cruzado entre usuários.

**4. Compartilhamento**
Não vendemos, alugamos nem compartilhamos seus dados com terceiros.

**5. Retenção**
Seus dados ficam armazenados enquanto sua conta estiver ativa. Você pode apagar tudo a qualquer momento em Perfil → Cuidado → Apagar todos os dados.

**6. Seus direitos (LGPD)**
De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
- Acessar seus dados
- Corrigir dados incorretos
- Solicitar a exclusão dos seus dados
- Revogar consentimento a qualquer momento

Para exercer esses direitos, entre em contato pelo e-mail de suporte.

**7. Contato**
Dúvidas ou solicitações: poscomp.app@gmail.com`

const TERMS_OF_USE = `**Termos de Uso**
Última atualização: junho de 2025

**1. Aceitação**
Ao usar o POSCOMP App, você concorda com estes termos. Se não concordar, não utilize o aplicativo.

**2. Descrição do serviço**
O POSCOMP App é uma plataforma de preparação para o exame POSCOMP, oferecendo:
- Simulados cronometrados com questões de edições anteriores
- Sistema de revisão espaçada (SM-2) para fixação do conteúdo
- Acompanhamento de histórico e desempenho

**3. Conta do usuário**
- O login é feito exclusivamente via conta Google
- Você é responsável pela segurança da sua conta Google
- Uma conta por usuário

**4. Plano Premium**
- O plano Premium é ativado mediante pagamento mensal
- O acesso premium é intransferível e vinculado à conta cadastrada
- Cancelamentos não geram reembolso proporcional pelo período restante

**5. Propriedade intelectual**
- As questões utilizadas são de domínio público (exames POSCOMP/SBC)
- O código, design e demais elementos do app pertencem aos seus criadores
- É proibida a reprodução ou redistribuição do conteúdo sem autorização

**6. Limitação de responsabilidade**
O app é fornecido "como está". Não garantimos:
- Aprovação no POSCOMP
- Disponibilidade ininterrupta do serviço
- Ausência de erros no gabarito das questões (erros podem ser reportados)

**7. Alterações nos termos**
Podemos atualizar estes termos a qualquer momento. O uso continuado após as alterações implica aceitação dos novos termos.

**8. Contato**
Dúvidas: poscomp.app@gmail.com`

type LegalType = 'privacy' | 'terms'

interface LegalModalProps {
  type: LegalType
  onClose: () => void
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  const content = type === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE
  const paragraphs = content.split('\n\n')

  return (
    <ModalOverlay onBackdropClick={onClose}>
      <div className="modal-card legal-modal" role="dialog" aria-modal="true">
        <div className="legal-modal__body">
          {paragraphs.map((para, i) => {
            if (para.startsWith('**') && para.endsWith('**') && !para.slice(2).includes('**')) {
              return <h2 key={i} className="legal-modal__title">{para.replace(/\*\*/g, '')}</h2>
            }
            const parts = para.split(/(\*\*[^*]+\*\*)/)
            return (
              <p key={i} className="legal-modal__para">
                {parts.map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                    : part
                )}
              </p>
            )
          })}
        </div>
        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <md-text-button onClick={onClose}>Fechar</md-text-button>
        </div>
      </div>
    </ModalOverlay>
  )
}
