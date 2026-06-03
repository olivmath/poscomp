# Métricas e Analytics

## O que é medido

O app não tem um sistema de analytics externo (sem Amplitude, Mixpanel, Google Analytics). As métricas são derivadas dos dados do Firestore.

---

## Métricas por usuário (derivadas no frontend)

Calculadas pelo hook `useResults` no cliente a partir dos documentos `users/{uid}/results`:

### `Analytics` (tipo do `useResults`)

```typescript
interface Analytics {
  streak: number                          // dias consecutivos com atividade
  activeDaysThisWeek: string[]           // ISO dates dos últimos 7 dias com resultado
  totalSimulados: number
  avgScore: number                        // média de acertos (%)
  recentScores: Array<{                   // últimos N simulados
    score: number
    total: number
    date: Date
  }>
  byMateria: Record<Materia, {
    pct: number                           // % de acerto cumulativo
    correct: number
    total: number
  }>
}
```

### Como `streak` é calculado

1. Ordena todos os resultados por `completedAt` descrescente
2. Extrai datas únicas (1 por dia)
3. Conta dias consecutivos até hoje a partir do mais recente

### Como `activeDaysThisWeek` é calculado

Filtra resultados dos últimos 7 dias e extrai as datas únicas.

---

## Métricas que **não existem** (gaps)

| Métrica                              | Impacto              |
|--------------------------------------|----------------------|
| Tempo médio por questão              | Alto (já há `timeSpentSeconds` mas sem breakdown por questão) |
| Taxa de abandono de simulado         | Alto (só contabiliza simulados finalizados) |
| Questões mais erradas globalmente    | Alto (dados ficam isolados por usuário) |
| Funil de conversão Free → Premium   | Alto (sem rastreamento explícito) |
| Retenção D1/D7/D30                   | Alto (sem sistema dedicado) |
| Revenue tracking                     | Alto (aprovação manual, sem webhook de pagamento) |
| Erro por Cloud Function              | Médio (logs existem, mas sem alertas configurados) |
| Latência das functions               | Médio (sem APM) |

---

## Dados disponíveis para analytics futuro

Tudo que existe hoje pode ser agregado por um job batch:

| Dado                     | Onde fica                           | Granularidade |
|--------------------------|-------------------------------------|---------------|
| Acertos por questão      | `results/{id}.answers[].correct`    | Por usuário   |
| Tempo por simulado       | `results/{id}.timeSpentSeconds`     | Por simulado  |
| Área mais fraca          | `results/{id}.materiaBreakdown`        | Por simulado  |
| Uso da revisão           | `srs_cards/{id}.repetitions`        | Por card      |
| Retenção básica          | `users/{uid}.lastActivity`          | Por usuário   |
| Plano atual              | `users/{uid}.isPremium + planType`  | Por usuário   |
| Tickets premium          | `premium_requests/{id}`             | Por solicitação |
| Problemas reportados     | `flagged_questions/{id}`            | Por questão   |

---

## Métricas de sistema (Firestore nativo)

Disponíveis no console Firebase sem código adicional:

- Leituras/escritas por coleção (Firestore usage)
- Latência das Cloud Functions (Cloud Console)
- Erros por function (Cloud Logging)
- Usuários ativos (Firebase Auth console)
- FCM delivery rate (Firebase console → Cloud Messaging)

---

## Recomendações para o novo backend

1. **Event logging**: ao finalizar um simulado, emitir um evento estruturado (BigQuery, Segment, etc.) com: `uid, planType, score, totalQuestions, materias, timeSpentSeconds, completedAt` — sem PII além do uid
2. **Funil de billing**: logar eventos `premium_flow_started`, `pix_copied`, `receipt_uploaded`, `request_approved/denied`
3. **Stripe/Pagar.me**: substituir o fluxo manual de PIX + aprovação manual por um webhook de pagamento — elimina o lag de 24h e possibilita métricas de revenue real-time
4. **Alertas**: configurar alertas no Cloud Monitoring para `error_count > 0` nas functions críticas (`finishSimulado`, `reviewPremiumRequest`)
