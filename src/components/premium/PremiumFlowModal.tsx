import '@material/web/progress/circular-progress.js'
import { useState, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { storage, db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { ModalOverlay } from '../ModalOverlay'

const PIX_KEY = 'poscomp@app.com'
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_KEY)}`

interface Props {
  open: boolean
  onClose: () => void
}

export function PremiumFlowModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function handleClose() {
    setStep(1)
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
    if (!file || !user) return

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

      const receiptUrl = await getDownloadURL(storageRef)

      await addDoc(collection(db, 'premium_requests'), {
        uid: user.uid,
        status: 'pending',
        receiptUrl,
        receiptType: file.type,
        createdAt: serverTimestamp(),
      })

      setStep(4)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar comprovante.'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ModalOverlay onBackdropClick={uploading ? undefined : handleClose}>
      <div className="premium-modal-card" role="dialog" aria-modal="true" aria-labelledby="premium-modal-title">

        {/* Step 1 — Info */}
        {step === 1 && (
          <div className="premium-modal-step">
            <span className="material-symbols-outlined premium-modal-icon">workspace_premium</span>
            <h2 id="premium-modal-title" className="premium-modal-title">Assinar Premium</h2>
            <p className="premium-modal-desc">
              Desbloqueie a <strong>Revisão Espaçada</strong> e acelere sua preparação para o POSCOMP com o algoritmo SM-2.
            </p>
            <ul className="premium-modal-benefits">
              <li><span className="material-symbols-outlined">check_circle</span> Revisão espaçada (SM-2)</li>
              <li><span className="material-symbols-outlined">check_circle</span> Priorização por confiança</li>
              <li><span className="material-symbols-outlined">check_circle</span> Histórico completo</li>
            </ul>
            <div className="premium-modal-price">R$ 10,00</div>
            <button className="premium-modal-btn premium-modal-btn--primary" onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        )}

        {/* Step 2 — PIX */}
        {step === 2 && (
          <div className="premium-modal-step">
            <h2 id="premium-modal-title" className="premium-modal-title">Pagamento via PIX</h2>
            <p className="premium-modal-desc">Valor: <strong>R$ 10,00</strong></p>
            <img
              src={QR_URL}
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
              <button
                className="premium-modal-btn premium-modal-btn--ghost"
                onClick={handleCopyPix}
                aria-label="Copiar chave PIX"
              >
                <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <button className="premium-modal-btn premium-modal-btn--primary" onClick={() => setStep(3)}>
              Pagamento enviado
            </button>
          </div>
        )}

        {/* Step 3 — Upload */}
        {step === 3 && (
          <div className="premium-modal-step">
            <h2 id="premium-modal-title" className="premium-modal-title">Enviar comprovante</h2>
            <p className="premium-modal-desc">
              Envie o comprovante do pagamento para ativarmos seu acesso.<br />
              <span style={{ fontSize: '0.85em', opacity: 0.7 }}>Formatos aceitos: imagem (JPG, PNG) ou PDF.</span>
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
                    <span className="material-symbols-outlined">error</span>
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
                <button
                  className="premium-modal-btn premium-modal-btn--primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined">upload</span>
                  {uploadError ? 'Tentar novamente' : 'Selecionar arquivo'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 4 — Feedback */}
        {step === 4 && (
          <div className="premium-modal-step">
            <span className="material-symbols-outlined premium-modal-icon premium-modal-icon--success">check_circle</span>
            <h2 id="premium-modal-title" className="premium-modal-title">Estamos liberando seu acesso!</h2>
            <p className="premium-modal-desc">
              Seu comprovante foi recebido. Em até 24h seu acesso Premium será ativado.
            </p>
            <button className="premium-modal-btn premium-modal-btn--primary" onClick={handleClose}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}
