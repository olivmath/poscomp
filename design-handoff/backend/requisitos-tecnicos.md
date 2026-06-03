# Requisitos Técnicos — Backend

Exigências não-negociáveis de segurança, corretude e escalabilidade para as Cloud Functions e o Firestore.

---

## Segurança

- `getFlaggedQuestions` e `resolveFlaggedQuestion` devem exigir `requireAdmin(request)` — acesso restrito a admins, nunca a qualquer usuário autenticado
- `getPendingCards` e `reviewCard` devem verificar `users/{uid}.isPremium` e `premiumExpiresAt` server-side antes de processar — se expirado, retornar `permission-denied` e setar `isPremium = false`
- A chave PIX não deve ser exposta no cliente — `getPixConfig` lê de variável de ambiente server-side e retorna chave + QR base64
- FCM tokens devem ser salvos via `registerFcmToken(token)` com validação de formato — sem write direto pelo cliente

---

## Corretude do SM-2

- `finishSimulado` **não deve** sobrescrever `dueDate` de um `SrsCard` onde `studied === true` — o intervalo SM-2 já calculado deve ser preservado; sobrescrever apenas se `studied === false` (card nunca revisado)
- O `interval` calculado pelo SM-2 deve ter limite máximo de **365 dias** — `Math.min(interval, 365)`

---

## IDs e integridade de dados

- IDs de questões devem ser gerados de forma atômica — usar `FieldValue.increment()` em `metadata/counters.questionCount` ou IDs auto-gerados pelo Firestore com campo `sequentialId` separado
- Ao deletar uma questão, deve-se usar soft delete (`deleted: true`) e filtrar nas queries — ou iniciar processo assíncrono que remove os `srs_cards` órfãos de todos os usuários
- `SimuladoResult.answers[].question` deve incluir `questionVersion` além do snapshot — permite auditar qual versão da questão foi respondida

---

## Idempotência e confiabilidade

- `finishSimulado` deve aceitar `simuladoId: string` gerado pelo cliente no início do simulado — a function verifica se já existe resultado com esse ID antes de criar (evita duplicação em retries)
- `getFlaggedQuestions` deve suportar paginação (`limit`, `startAfter`) — sem `.get()` de coleção inteira

---

## Storage

- Comprovantes de PIX devem usar Firebase Storage Download URL (token permanente por padrão) — não Signed URL com expiração manual em 2099
- Alternativa: armazenar `storagePath` e gerar Signed URL on-demand quando o admin acessar

---

## Observabilidade

- Cloud Monitoring deve ter alertas configurados para:
  - `error_count > 0` nas functions críticas: `finishSimulado`, `reviewPremiumRequest`
  - Latência acima de threshold nas functions de leitura
  - Falha nos jobs de notificação agendados

---

## Funcionalidades obrigatórias

| Funcionalidade                              | Prioridade | Complexidade |
|---------------------------------------------|------------|--------------|
| Verificação de `premiumExpiresAt` server-side | Alta     | Baixa        |
| Idempotência no `finishSimulado`            | Alta       | Média        |
| Soft delete de questões                     | Alta       | Baixa        |
| `registerFcmToken` com validação            | Alta       | Baixa        |
| Paginação em `getFlaggedQuestions`          | Média      | Baixa        |
| IDs atômicos para questões                  | Média      | Baixa        |
| Alertas no Cloud Monitoring                 | Média      | Baixa        |
| Exportação dos dados do usuário (LGPD)      | Média      | Média        |
| Rate limiting por usuário nas functions     | Média      | Média        |
