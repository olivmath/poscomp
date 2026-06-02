import '@material/web/progress/circular-progress.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import { useState, useRef } from 'react'
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { callSubmitPremiumRequest } from '../../hooks/useFunctions'
import { ModalOverlay } from '../ModalOverlay'

const PIX_KEY = 'poscomp@app.com'

const PLAN_PRICE: Record<'pro' | 'pro_max', string> = {
  pro: 'R$ 10,00',
  pro_max: 'R$ 60,00',
}

interface Props {
  open: boolean
  onClose: () => void
}

export function PremiumFlowModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'pro_max' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const price = selectedPlan ? PLAN_PRICE[selectedPlan] : ''
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_KEY)}`

  function handleClose() {
    setStep(1)
    setSelectedPlan(null)
    setUploadError(null)
    onClose()
  }

  async function handleCopyPix() {
    await navigator.clipboard.writeText(PIX_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user || !selectedPlan) return

    setUploading(true)
    setUploadError(null)
    try {
      const timestamp = Date.now()
      const storagePath = `receipts/${user.uid}/${timestamp}_${file.name}`
      const storageRef = ref(storage, storagePath)

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tempo esgotado. Verifique sua conexão e tente novamente.')), 20000)
      )
      await Promise.race([uploadBytes(storageRef, file), timeout])

      await callSubmitPremiumRequest({ storagePath, receiptType: file.type, planType: selectedPlan })

      setStep(5)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar comprovante.'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ModalOverlay onBackdropClick={uploading ? undefined : handleClose}>
      <div className="modal-card premium-modal-card" role="dialog" aria-modal="true" aria-labelledby="premium-modal-title">

        {/* Step 1 — Escolha do plano */}
        {step === 1 && (
          <div className="premium-modal-step">
            <md-icon className="premium-modal-icon">workspace_premium</md-icon>
            <h2 id="premium-modal-title" className="premium-modal-title">Escolha seu plano</h2>
            <div className="plan-options">
              <button
                className={`plan-option${selectedPlan === 'pro' ? ' plan-option--selected' : ''}`}
                onClick={() => setSelectedPlan('pro')}
                aria-pressed={selectedPlan === 'pro'}
              >
                <span className="plan-option__name">Pro</span>
                <span className="plan-option__price">
                  R$ 10<span className="plan-option__price-unit">/mês</span>
                </span>
                <span className="plan-option__desc">Revisão espaçada · Histórico</span>
              </button>

              <button
                className={`plan-option${selectedPlan === 'pro_max' ? ' plan-option--selected' : ''}`}
                onClick={() => setSelectedPlan('pro_max')}
                aria-pressed={selectedPlan === 'pro_max'}
              >
                <span className="plan-option__name">Pro MAX</span>
                <span className="plan-option__price">
                  R$ 5<span className="plan-option__price-unit">/mês</span>
                </span>
                <span className="plan-option__desc">
                  Revisão espaçada · Histórico<span className="plan-option__desc--muted"> · anual</span>
                </span>
              </button>
            </div>

            <p className="plan-compare">Pro R$10/mês · Pro MAX R$5/mês</p>

            <md-filled-button
              onClick={() => selectedPlan && setStep(2)}
              className="btn-full"
              disabled={!selectedPlan || undefined}
            >
              Continuar
            </md-filled-button>
          </div>
        )}

        {/* Step 2 — Info do plano */}
        {step === 2 && (
          <div className="premium-modal-step">
            <md-icon className="premium-modal-icon">workspace_premium</md-icon>
            <h2 id="premium-modal-title" className="premium-modal-title">
              Plano {selectedPlan === 'pro_max' ? 'Pro MAX' : 'Pro'}
            </h2>
            <p className="premium-modal-desc">
              Desbloqueie a <strong>Revisão Espaçada</strong> e acelere sua preparação para o POSCOMP com o algoritmo SM-2.
            </p>
            <ul className="premium-modal-benefits">
              <li><md-icon>check_circle</md-icon> Revisão espaçada (SM-2)</li>
              <li><md-icon>check_circle</md-icon> Priorização por confiança</li>
              <li><md-icon>check_circle</md-icon> Histórico completo</li>
            </ul>
            <div className="premium-modal-price">{price}</div>
            <md-filled-button onClick={() => setStep(3)} className="btn-full">
              Continuar
            </md-filled-button>
          </div>
        )}

        {/* Step 3 — PIX */}
        {step === 3 && (
          <div className="premium-modal-step">
            <h2 id="premium-modal-title" className="premium-modal-title">Pagamento via PIX</h2>
            <p className="premium-modal-desc">Valor: <strong>{price}</strong></p>
            <img
              src={qrUrl}
              alt="QR Code PIX"
              className="premium-modal-qr"
              width={200}
              height={200}
            />
            <div className="premium-modal-pix-row">
              <input
                type="text"
                readOnly
                value={PIX_KEY}
                className="premium-modal-pix-input"
                aria-label="Chave PIX"
              />
              <md-outlined-button onClick={handleCopyPix}>
                <md-icon slot="icon">{copied ? 'check' : 'content_copy'}</md-icon>
                {copied ? 'Copiado' : 'Copiar'}
              </md-outlined-button>
            </div>
            <md-filled-button onClick={() => setStep(4)} className="btn-full">
              Pagamento enviado
            </md-filled-button>
          </div>
        )}

        {/* Step 4 — Upload */}
        {step === 4 && (
          <div className="premium-modal-step">
            <h2 id="premium-modal-title" className="premium-modal-title">Enviar comprovante</h2>
            <p className="premium-modal-desc">
              Envie o comprovante do pagamento para ativarmos seu acesso.<br />
              <span className="type-label-medium" style={{ opacity: 0.7 }}>Formatos aceitos: imagem (JPG, PNG) ou PDF.</span>
            </p>
            {uploading ? (
              <div className="premium-modal-spinner">
                <md-circular-progress indeterminate />
                <span>Enviando...</span>
              </div>
            ) : (
              <>
                {uploadError && (
                  <p className="premium-modal-error" role="alert">
                    <md-icon>error</md-icon>
                    {uploadError}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="premium-modal-file-input"
                  onChange={handleFileChange}
                  aria-label="Selecionar comprovante"
                />
                <md-filled-button onClick={() => fileInputRef.current?.click()} className="btn-full">
                  <md-icon slot="icon">upload</md-icon>
                  {uploadError ? 'Tentar novamente' : 'Selecionar arquivo'}
                </md-filled-button>
              </>
            )}
          </div>
        )}

        {/* Step 5 — Feedback */}
        {step === 5 && (
          <div className="premium-modal-step">
            <md-icon className="premium-modal-icon premium-modal-icon--success">check_circle</md-icon>
            <h2 id="premium-modal-title" className="premium-modal-title">Estamos liberando seu acesso!</h2>
            <p className="premium-modal-desc">
              Seu comprovante foi recebido. Em até 24h seu acesso será ativado.
            </p>
            <md-filled-button onClick={handleClose} className="btn-full">
              Fechar
            </md-filled-button>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}
