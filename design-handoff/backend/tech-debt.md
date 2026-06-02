# Tech Debt — Backend

---

## 🔴 Crítico (segurança / corretude)

### 1. `getFlaggedQuestions` e `resolveFlaggedQuestion` sem verificação de admin

**Onde**: `admin.ts:6` e `admin.ts:15`
**Problema**: ambas verificam apenas `request.auth != null` (usuário autenticado). Qualquer usuário logado consegue:
- Listar todos os reports com `uid` e `comment` de outros usuários
- Marcar qualquer report como resolvido
**Fix**: adicionar `requireAdmin(request)` igual às outras functions admin.

---

### 2. Criação de `SrsCard` com `dueDate = now` em todo `finishSimulado`

**Onde**: `finishSimulado.ts:247-269`
**Problema**: toda vez que o usuário refaz um simulado com uma questão que já tem card, o `dueDate` é resetado para `now`. Isso força a questão a aparecer na revisão imediatamente, ignorando o intervalo SM-2 já calculado.
**Impacto**: o SM-2 perde eficácia para questões repetidas em múltiplos simulados.
**Fix**: não sobrescrever `dueDate` se `card.studied === true` (card já foi revisado via `reviewCard`). Sobrescrever apenas se `studied === false` (card nunca foi revisado).

---

## 🟡 Importante (qualidade / escalabilidade)

### 3. IDs de questões como inteiros auto-incrementados

**Onde**: `adminQuestions.ts:22-24`, `types.ts:36`
**Problema**: `nextId = maxId + 1` via query Firestore não é atômico. Se dois admins criarem questões simultaneamente, pode haver colisão de ID.
**Fix**: usar `FieldValue.increment()` em um contador centralizado (`metadata/counters.questionCount`), ou usar UUIDs, ou usar IDs auto-gerados pelo Firestore com um campo `sequentialId` separado.

### 4. Snapshot da questão embutido no resultado — sem referência ao original

**Onde**: `finishSimulado.ts:162-180`, `SimuladoResult.answers[].question`
**Trade-off**: o snapshot garante imutabilidade do histórico, mas duplica dados. Se uma questão tiver erro e for corrigida, os resultados antigos mantêm a versão errada.
**Fix**: armazenar apenas `questionId` nos resultados e fazer join na leitura. Ou armazenar snapshot + `questionVersion` para permitir auditoria de qual versão foi respondida.

### 5. `deleteQuestion` não limpa SRS cards órfãos

**Onde**: `adminQuestions.ts:50-66`
**Problema**: ao deletar uma questão, os `srs_cards` de todos os usuários que responderam essa questão ficam órfãos no Firestore. `getPendingCards` silenciosamente os filtra (`filter(({ card }) => questionsMap.has(card.questionId))`), mas os documentos continuam acumulando espaço.
**Fix**: ao deletar uma questão, iniciar um processo async que busca todos os usuários com esse card e os deleta. Ou marcar questões como `deleted: true` (soft delete) e filtrar nas queries.

### 6. `getFlaggedQuestions` sem paginação

**Onde**: `admin.ts:11`
**Problema**: busca todos os reports não resolvidos de uma vez com `.get()`. Se acumular muitos, pode causar timeout na function ou retorno muito grande.
**Fix**: adicionar paginação (`limit`, `startAfter`).

### 7. Signed URL com expiração em 2099

**Onde**: `premiumRequests.ts:38-41`
**Problema**: tecnicamente funciona, mas é uma gambiarra. Signed URLs têm limite máximo de 7 dias no GCS com service account. A data `2099-01-01` só funciona se a service account ainda existir — se o projeto for migrado ou a conta rotacionada, as URLs expiram.
**Fix**: usar Firebase Storage Download URLs (tokens permanentes por padrão) ou armazenar o `storagePath` e gerar Signed URL on-demand quando o admin precisar acessar.

### 8. Billing 100% manual

**Fluxo atual**: PIX → comprovante → upload → admin aprova manualmente em até 24h
**Problema**:
- SLA de 24h de ativação é ruim para conversão
- Admin pode esquecer de revisar
- Sem webhook de pagamento = sem dados de revenue real-time
- Sem lógica de renovação automática
- Sem cancelamento self-service
**Fix**: integrar Stripe ou Pagar.me. O fluxo PIX pode ser mantido como alternativa, mas o webhook elimina a aprovação manual.

### 9. Expiração de premium não é verificada no backend

**Onde**: `users/{uid}.premiumExpiresAt` existe, mas nenhuma function verifica se expirou antes de conceder acesso premium.
**Problema**: o frontend verifica `premiumExpiresAt < now` mas um usuário experiente poderia chamar functions diretamente com um token válido, mesmo após a expiração.
**Fix**: nas functions que requerem premium (`getPendingCards`, `reviewCard`), verificar `users/{uid}.isPremium` e `premiumExpiresAt` antes de processar. Se expirado, retornar `permission-denied` e setar `isPremium = false` no documento.

---

## 🔵 Melhoria (operações / observabilidade)

### 10. Sem idempotência no `finishSimulado`

**Problema**: se o cliente chamar `finishSimulado` duas vezes com os mesmos dados (retry por timeout de rede), dois documentos de resultado serão criados.
**Fix**: o cliente deve incluir um `simuladoId` gerado no início do simulado. A function verifica se já existe um resultado com esse ID antes de criar.

### 11. `applySm2` sem bounds no `interval`

**Onde**: `reviewCard.ts:66-88`
**Problema**: `interval` cresce indefinidamente (`round(interval * easeFactor)`). Após muitas revisões bem-sucedidas, um card pode ter intervalo de anos, o que não faz sentido para preparação para prova.
**Fix**: adicionar `Math.min(interval, 365)` ou outro limite máximo razoável.

### 12. Sem alertas configurados

**Problema**: não há Cloud Monitoring alerts para:
- Taxa de erros nas Cloud Functions
- Latência > threshold
- Falha nos jobs de notificação
**Fix**: configurar alertas no Cloud Monitoring para `log_based_metric` dos `ERROR` logs das functions críticas.

### 13. FCM tokens escritos diretamente pelo cliente sem validação

**Onde**: `useNotifications.ts` no frontend — write direto para `users/{uid}.fcmTokens`
**Problema**: sem validação de formato do token antes de armazenar. Um token malformado não causa erro imediato, mas vai falhar silenciosamente em todos os envios.
**Fix**: criar uma Cloud Function `registerFcmToken(token: string)` que valide o formato antes de salvar.

---

## 📋 Funcionalidades faltando no backend

| Feature                              | Impacto    | Complexidade |
|--------------------------------------|------------|--------------|
| Renovação automática de assinatura   | Alto       | Alta         |
| Cancelamento self-service de premium | Alto       | Média        |
| Webhook de pagamento (Stripe/PagarMe)| Alto       | Alta         |
| Verificação de `premiumExpiresAt` no servidor | Alto | Baixa   |
| Exportação dos dados do usuário (LGPD) | Médio    | Média        |
| Rate limiting por usuário nas functions | Médio  | Média        |
| Índice composto: `srs_cards` por `uid + dueDate` | Médio | Baixa |
| Soft delete de questões              | Médio      | Baixa        |
| Paginação nas functions admin        | Médio      | Baixa        |
| Idempotência no `finishSimulado`     | Médio      | Média        |
