# Firebase Storage

## Estrutura de paths

```
gs://poscomp-olivmath.appspot.com/
└── receipts/
    └── {uid}/
        └── {timestamp}_{filename}
```

**Único uso atual**: comprovantes de pagamento PIX enviados no fluxo de assinatura premium.

---

## Regras de acesso

```
receipts/{uid}/{fileName}
  write: request.auth != null && request.auth.uid == uid
  read:  request.auth != null && (request.auth.uid == uid || request.auth.token.admin == true)
```

| Ação   | Quem pode                              |
|--------|----------------------------------------|
| Upload | somente o próprio usuário (`uid` do path = `uid` do token) |
| Download | dono do arquivo OU admin             |

---

## Fluxo de upload

```
Cliente
  1. Faz upload direto: uploadBytes(ref, file)
     path: receipts/{uid}/{timestamp}_{filename}
     tipos aceitos: image/*, application/pdf

  2. Chama submitPremiumRequest({ storagePath, receiptType, planType })

  3. Cloud Function:
     - Valida que storagePath pertence ao uid autenticado
     - Gera Signed URL (expira 2099)
     - Salva URL em premium_requests/{id}.receiptUrl
```

---

## Notas operacionais

- **Signed URL longa**: expira em `2099-01-01` — decisão intencional para não expirar durante o período de suporte ao produto
- **Sem lifecycle policy**: arquivos em `receipts/` não são deletados automaticamente após a aprovação/negação do ticket — acúmulo a longo prazo
- **Sem compressão**: imagens são armazenadas com o tamanho original do upload do usuário
- **Sem scan antivírus**: PDFs e imagens não são inspecionados antes de armazenar

---

## Configuração necessária no novo backend

Se migrar para outro provedor de storage (S3, GCS nativo, etc.):
- Replicar a lógica de path-ownership no upload
- Replicar a geração de signed URLs no `submitPremiumRequest`
- Manter o campo `receiptType` para o admin saber como renderizar o comprovante
