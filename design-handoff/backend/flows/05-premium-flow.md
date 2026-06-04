# Backend — Fluxo 5: Premium (Billing)

```
[Usuário abre modal de planos — Step 3: Pagamento PIX]
        │
        ▼
getPixConfig({ planType })
  ├── lê PIX_KEY de variável de ambiente (não exposta ao cliente)
  ├── Gera transactionId único
  ├── Cria premium_requests/{transactionId} com status='awaiting_receipt', planType, uid
  ├── Gera QR code server-side (PNG 200×200, base64)
  ├── Gera PIX Copia e cola server-side
  └── retorna { transactionId, pixQrBase64, pixCopyPaste }

[Usuário faz upload do comprovante — Step 4]
        │
        ▼
submitPremiumRequest({ transactionId, fileBase64, receiptType })
  ├── Valida transactionId existe em premium_requests e pertence ao uid
  ├── Valida status == 'awaiting_receipt' (evita re-submit)
  ├── Backend salva arquivo no Storage: receipts/{transactionId}/receipt
  ├── Atualiza premium_requests/{transactionId}:
  │     status='pending', storagePath, receiptType, submittedAt
  └── retorna { success: true }
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

[Frontend recebe atualização de premium via push do backend (FCM)]
        │
        └── isPremium=true → libera Revisão e Histórico imediatamente
              (não usa onSnapshot direto em users/{uid})
```

## Estados do `premiumStatus` no `UserDocument`

| Status              | Quem seta                      | O que o frontend exibe              |
|---------------------|-------------------------------|-------------------------------------|
| `free`              | valor padrão                  | "Plano Free" + botão "Ver planos"   |
| `awaiting_receipt`  | `getPixConfig`                | "Aguardando comprovante"            |
| `pending`           | `submitPremiumRequest`        | "Aguardando aprovação" (sem botão)  |
| `active`            | `reviewPremiumRequest` approve| "Plano Pro/Max" + data de renovação |

## Segurança em camadas

| Camada                  | Proteção                                                                      |
|-------------------------|-------------------------------------------------------------------------------|
| `getPixConfig`          | cria cobrança vinculada ao uid — transactionId não é adivinhávelF            |
| `submitPremiumRequest`  | valida transactionId pertence ao uid e status == 'awaiting_receipt'          |
| Storage                 | escrita feita exclusivamente pelo backend (admin SDK) — cliente não acessa    |
| Firestore rules         | `premium_requests` sem `create/update` para cliente — só admin SDK           |
| `reviewPremiumRequest`  | requer custom claim `{ admin: true }`                                        |
