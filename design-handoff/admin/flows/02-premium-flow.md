# Admin Flow 2 — Revisão de Solicitações Premium

```
[Admin abre /premium]
        │
        └── Leitura direta: query premium_requests WHERE status='pending'
              ordenado por createdAt ASC (mais antigo primeiro)

[Admin clica em um ticket]
        │
        ├── Exibe comprovante via Signed URL (receiptUrl)
        │
        ├── [Aprovar]
        │     └── reviewPremiumRequest({ requestId, action: 'approve' })
        │           ├── Calcula premiumExpiresAt (pro: +30d, pro_max: +365d)
        │           ├── Atualiza users/{uid}: isPremium=true, planType, premiumExpiresAt
        │           ├── Atualiza premium_requests/{id}: status='approved'
        │           └── Push notification ao usuário (fire-and-forget)
        │
        └── [Negar]
              └── reviewPremiumRequest({ requestId, action: 'deny' })
                    └── Atualiza premium_requests/{id}: status='denied'
                          NÃO altera users/{uid}
```

## Estados possíveis do ticket

| Status     | Pode agir? | Ação disponível       |
|------------|------------|-----------------------|
| `pending`  | Sim        | Aprovar ou Negar      |
| `approved` | Não        | — (somente leitura)   |
| `denied`   | Não        | — (somente leitura)   |

Tentar agir em ticket não-`pending` → `failed-precondition` do backend.
