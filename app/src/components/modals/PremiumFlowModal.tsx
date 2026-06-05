import { useState, useRef } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase'
import { ModalOverlay } from './ModalOverlay'

type Plan = 'pro' | 'pro_max'
type Step = 1 | 2 | 3 | 4 | 5

interface PixConfigResult {
  transactionId: string
  pixQrBase64: string
  pixCopyPaste: string
}

interface SubmitResult {
  success: boolean
}

interface PremiumFlowModalProps {
  onClose: () => void
}

export function PremiumFlowModal({ onClose }: PremiumFlowModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [pixData, setPixData] = useState<PixConfigResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingPix, setLoadingPix] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleGetPix() {
    if (!plan) return
    setLoadingPix(true)
    setUploadError('')
    try {
      const fn = httpsCallable<{ planType: Plan }, PixConfigResult>(functions, 'getPixConfig')
      const r = await fn({ planType: plan })
      setPixData(r.data)
      setStep(3)
    } catch {
      setUploadError('Erro ao gerar QR Code. Tente novamente.')
    } finally {
      setLoadingPix(false)
    }
  }

  async function handleFileUpload(file: File) {
    if (!pixData) return
    setUploading(true)
    setUploadError('')
    try {
      const base64 = await fileToBase64(file)
      const fn = httpsCallable<{ transactionId: string; fileBase64: string; receiptType: string }, SubmitResult>(
        functions,
        'submitPremiumRequest'
      )
      await fn({ transactionId: pixData.transactionId, fileBase64: base64, receiptType: file.type })
      setStep(5)
    } catch (e) {
      console.error('submitPremiumRequest error', e)
      setUploadError('Erro ao enviar comprovante. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function copyPix() {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.pixCopyPaste)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canClose = step !== 4 && step !== 5
  const canGoBack = (step === 2 || step === 3) || (step === 4 && !uploading)

  return (
    <ModalOverlay onBackdropClick={canClose ? onClose : undefined}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFileUpload(f)
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {canGoBack && (
            <button
              onClick={() => { setUploadError(''); setStep((s) => (s - 1) as Step) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              aria-label="Voltar"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <h3 style={{ margin: 0, fontSize: 18 }}>
            {step === 1 && 'Escolha seu plano'}
            {step === 2 && 'Benefícios inclusos'}
            {step === 3 && 'Pagamento via PIX'}
            {step === 4 && 'Enviar comprovante'}
            {step === 5 && 'Pedido enviado!'}
          </h3>
        </div>
        {canClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: s <= step ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
            }}
          />
        ))}
      </div>

      {/* Step 1: Choose plan */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {([
            { id: 'pro' as Plan, name: 'Pro', price: 'R$10/mês', desc: '1 mês de acesso', highlight: false },
            { id: 'pro_max' as Plan, name: 'Pro MAX', price: 'R$5/mês', desc: 'Cobrança anual (R$60/ano)', highlight: true },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              style={{
                background: plan === p.id ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                border: `2px solid ${plan === p.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                color: plan === p.id ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
              }}
            >
              {p.highlight && (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 12,
                    background: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 8,
                  }}
                >
                  MELHOR VALOR
                </span>
              )}
              <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
              <div style={{
                fontSize: 20, fontWeight: 800, margin: '4px 0',
                color: plan === p.id ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-primary)',
              }}>{p.price}</div>
              <div style={{
                fontSize: 13,
                color: plan === p.id ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                opacity: plan === p.id ? 0.8 : 1,
              }}>{p.desc}</div>
            </button>
          ))}
          <button
            onClick={() => setStep(2)}
            disabled={!plan}
            style={{
              marginTop: 8,
              background: plan ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              color: plan ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              fontSize: 15,
              cursor: plan ? 'pointer' : 'not-allowed',
            }}
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2: Benefits */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--md-sys-color-primary-container)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {plan === 'pro' ? 'Plano Pro — R$10/mês' : 'Plano Pro MAX — R$5/mês (anual)'}
            </div>
            {plan === 'pro_max' && (
              <div style={{ fontSize: 13, color: 'var(--md-sys-color-primary)', fontWeight: 600, marginBottom: 8 }}>
                Total: R$60/ano (economia de 50%)
              </div>
            )}
            {plan === 'pro' && (
              <div style={{ fontSize: 13, color: 'var(--md-sys-color-on-primary-container)', marginBottom: 8 }}>
                1 mês de acesso
              </div>
            )}
          </div>
          {[
            { icon: 'style', text: 'Revisão espaçada SM-2 com priorização inteligente' },
            { icon: 'history', text: 'Histórico completo de todos os simulados' },
            { icon: 'analytics', text: 'Análise detalhada por matéria e confiança' },
            { icon: 'notifications', text: 'Notificações de revisão programadas' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>{icon}</span>
              <span style={{ fontSize: 14 }}>{text}</span>
            </div>
          ))}
          <button
            onClick={handleGetPix}
            disabled={loadingPix}
            style={{
              marginTop: 8,
              background: loadingPix ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-primary)',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              color: loadingPix ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)',
              fontWeight: 700,
              fontSize: 15,
              cursor: loadingPix ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loadingPix && (
              <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>
                progress_activity
              </span>
            )}
            {loadingPix ? 'Gerando PIX…' : 'Continuar'}
          </button>
          {uploadError && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-error)' }}>{uploadError}</p>
          )}
        </div>
      )}

      {/* Step 3: PIX QR Code */}
      {step === 3 && pixData && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <img
            src={pixData.pixQrBase64}
            alt="QR Code PIX"
            style={{ width: 200, height: 200, borderRadius: 8 }}
          />
          <button
            onClick={copyPix}
            style={{
              background: copied ? 'var(--color-score-high)' : 'var(--md-sys-color-secondary-container)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              color: copied ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copiado!' : 'Copiar PIX Copia e Cola'}
          </button>
          <button
            onClick={() => setStep(4)}
            style={{
              background: 'var(--md-sys-color-primary)',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              color: 'var(--md-sys-color-on-primary)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Pagamento enviado
          </button>
        </div>
      )}

      {/* Step 4: Upload receipt */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Envie o comprovante de pagamento (imagem JPG/PNG ou PDF).
          </p>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: 'var(--md-sys-color-primary)', animation: 'spin 1s linear infinite' }}
              >
                progress_activity
              </span>
              <p style={{ margin: 0, fontSize: 14 }}>Enviando…</p>
            </div>
          ) : uploadError ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-error)' }}>{uploadError}</p>
              <button
                onClick={() => { setUploadError(''); fileRef.current?.click() }}
                style={{
                  background: 'none',
                  border: '1px solid var(--md-sys-color-error)',
                  borderRadius: 8,
                  padding: '10px 0',
                  cursor: 'pointer',
                  color: 'var(--md-sys-color-error)',
                  fontWeight: 600,
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                background: 'var(--md-sys-color-primary)',
                border: 'none',
                borderRadius: 8,
                padding: '14px 0',
                color: 'var(--md-sys-color-on-primary)',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>upload_file</span>
              Selecionar arquivo
            </button>
          )}
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-score-high)' }}>
            check_circle
          </span>
          <h4 style={{ margin: 0, fontSize: 18, textAlign: 'center' }}>Estamos liberando seu acesso!</h4>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
            Em até 1h seu acesso será ativado após a confirmação do pagamento.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: 8,
              background: 'var(--md-sys-color-primary)',
              border: 'none',
              borderRadius: 8,
              padding: '14px 32px',
              color: 'var(--md-sys-color-on-primary)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      )}
    </ModalOverlay>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
