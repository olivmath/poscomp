# Backend — Fluxo 5: Premium (Billing)

```
[Usuário abre modal de planos — Step 3: Pagamento PIX]
        │
        └── getPixConfig()
              ├── lê PIX_KEY de variável de ambiente (não exposta ao cliente)
              ├── gera QR code server-side (PNG 200×200, base64)
              └── retorna { pixKey, pixQrBase64 }
                    (cliente pode cachear por até 1h)

[Usuário faz upload do comprovante — Step 4]
        │
        └── uploadBytes(storage, `receipts/{uid}/{timestamp}_{filename}`)
              ├── Storage rules: uid do path == uid do token
              └── tipos aceitos: image/*, application/pdf

[Usuário confirma "Pagamento enviado"]
        │
        └── submitPremiumRequest({ storagePath, receiptType, planType })
              ├── Valida: storagePath.startsWith(`receipts/${uid}/`)
              ├── Gera Signed URL do arquivo (expira 2099)
              ├── Cria premium_requests/{id} com status='pending'
              └── retorna { requestId }
                    → Trigger onPremiumRequestCreated (apenas log)

[Admin revisa o comprovante no painel]
        │
        └── reviewPremiumRequest({ requestId, action: 'approve' | 'deny' })
              │
              ├── [approve]
              │     ├── Calcula premiumExpiresAt:
              │     │     pro     → +30 dias
              │     │     pro_max → +365 dias
              │     ├── Atualiza users/{uid}: isPremium=true, planType, premiumExpiresAt
              │     ├── Atualiza premium_requests/{id}: status='approved', reviewedAt, reviewedBy
              │     └── notifyPremiumApproved() → FCM push (fire-and-forget)
              │
              └── [deny]
                    ├── Atualiza premium_requests/{id}: status='denied', reviewedAt, reviewedBy
                    └── NÃO altera users/{uid}

[Frontend detecta mudança via onSnapshot de users/{uid}]
        │
        └── isPremium=true → libera Revisão e Histórico imediatamente
```

## Estados do `premiumStatus` no `UserDocument`

| Status    | Quem seta                     | O que o frontend exibe              |
|-----------|-------------------------------|-------------------------------------|
| `free`    | valor padrão                  | "Plano Free" + botão "Ver planos"   |
| `pending` | `submitPremiumRequest`        | "Aguardando aprovação" (sem botão)  |
| `active`  | `reviewPremiumRequest` approve| "Plano Pro/Max" + data de renovação |

## Segurança em camadas

| Camada                  | Proteção                                                        |
|-------------------------|-----------------------------------------------------------------|
| Storage rules           | upload só em `receipts/{uid}/` do próprio usuário              |
| `submitPremiumRequest`  | valida `storagePath` pertence ao uid antes de gerar Signed URL |
| Firestore rules         | `premium_requests` sem `create` para cliente — só admin SDK    |
| `reviewPremiumRequest`  | requer custom claim `{ admin: true }`                          |
