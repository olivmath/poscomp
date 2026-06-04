# Métricas e Analytics

O app não tem analytics externo (sem Amplitude, Mixpanel, Google Analytics). Todas as métricas são derivadas do Firestore via `getAdminDashboard` (admin) e `useResults` (usuário).

---

## Métricas de Negócio

Expostas pela function `getAdminDashboard` (auth: admin).

### Schema de retorno

```typescript
interface AdminDashboardData {
  // ── Usuários ────────────────────────────────────────────────────
  totalUsers: number
  usersByPlan: {
    free: number
    pro: number
    pro_max: number
  }

  // ── Atividade (rolling) ─────────────────────────────────────────
  dau: number      // users com lastActivity >= hoje (00:00 BRT)
  wau: number      // users com lastActivity >= 7 dias atrás
  mau: number      // users com lastActivity >= 30 dias atrás

  // ── Retenção por cohort ─────────────────────────────────────────
  // Requer users.createdAt (ver data-model.md)
  // Cohort = usuários que criaram conta nos últimos 30 dias
  retention: {
    d1: number   // % do cohort que teve atividade no dia seguinte ao cadastro
    d7: number   // % do cohort que teve atividade em qualquer dia D2-D7
    d30: number  // % do cohort que teve atividade em qualquer dia D8-D30
  }

  // ── Funil Premium ───────────────────────────────────────────────
  // Derivado de premium_requests
  premiumFunnel: {
    total: number          // todos os tickets já criados
    pending: number        // status = 'pending'
    approved: number       // status = 'approved'
    denied: number         // status = 'denied'
    approvalRatePct: number           // approved / (approved + denied) * 100
    avgApprovalTimeHours: number      // média de (reviewedAt - createdAt) nos aprovados
  }

  // ── Churn risk ──────────────────────────────────────────────────
  premiumExpiringIn7Days: number    // isPremium=true AND premiumExpiresAt <= now+7d
  premiumExpiringIn30Days: number   // isPremium=true AND premiumExpiresAt <= now+30d
  expiredPremium: number            // isPremium=false AND premiumExpiresAt existia (churn confirmado)

  // ── Metadado ────────────────────────────────────────────────────
  computedAt: Timestamp
}
```

### Como cada métrica é calculada

| Métrica | Query Firestore |
|---|---|
| `totalUsers` | `listUsers()` do Firebase Auth Admin SDK (paginado) |
| `usersByPlan` | `collectionGroup users` — count por `planType` |
| `dau/wau/mau` | `users where lastActivity >= <threshold>` |
| `retention.d1/d7/d30` | Para cada user do cohort: verifica `activeDays[]` contém alguma data em D+1 / D+2..7 / D+8..30 |
| `premiumFunnel` | `premium_requests` — count por `status` + avg de `reviewedAt - createdAt` |
| `expiringIn7Days` | `users where isPremium=true AND premiumExpiresAt <= now+7d` |
| `expiredPremium` | `users where isPremium=false AND premiumExpiresAt != null` |

### Custo (leituras Firestore por chamada)

| Operação | Leituras estimadas |
|---|---|
| `usersByPlan` + `dau/wau/mau` | N usuários (1 read por user) |
| `premiumFunnel` | M tickets (1 read por ticket) |
| `retention` | N usuários do cohort (últimos 30d) |
| **Total** | ~2N + M — viável até ~50k usuários sem cache |

> Para apps com >50k usuários: mover para job scheduled que escreve em `metrics/dashboard` e `getAdminDashboard` apenas lê esse documento.

---

## Métricas de Usuário

Calculadas pelo hook `useResults` no cliente a partir de `users/{uid}/results`.

### Schema de retorno (`Analytics`)

```typescript
interface Analytics {
  // ── Engajamento ─────────────────────────────────────────────────
  streak: number                    // dias consecutivos com atividade (hoje incluso)
  activeDaysThisWeek: string[]      // ISO dates dos últimos 7 dias com resultado

  // ── Simulados ───────────────────────────────────────────────────
  totalSimulados: number
  avgScore: number                  // média de acertos (%)
  recentScores: Array<{
    score: number
    total: number
    date: Date
  }>

  // ── Por matéria (cumulativo) ─────────────────────────────────────
  byMateria: Record<Materia, {
    pct: number       // % de acerto acumulado
    correct: number
    total: number
  }>

  // ── Por ano do POSCOMP ───────────────────────────────────────────
  byAno: Record<number, {
    pct: number
    correct: number
    total: number
  }>

  // ── Tempo ───────────────────────────────────────────────────────
  avgTimePerSimuladoSeconds: number
  avgTimePerQuestionSeconds: number   // avgTimePerSimulado / totalQuestions médio

  // ── Questões mais erradas ────────────────────────────────────────
  weakestQuestions: Array<{
    questionId: number
    materia: Materia
    errorCount: number               // quantas vezes errou
    lastSeenAt: Date
  }>                                 // top 10, ordenado por errorCount desc

  // ── SRS ─────────────────────────────────────────────────────────
  srsProgress: {
    totalCards: number               // todos os srs_cards do usuário
    masteredCards: number            // cards com repetitions >= 5
    masteredPct: number              // masteredCards / totalCards * 100
  }
}
```

### Como calcular `byAno`

`answers[].question.ano` já está no snapshot salvo em `SimuladoResult`. Agrupar por `ano`, somar `correct` e `total`.

### Como calcular `weakestQuestions`

```
Para cada result em results[]:
  Para cada answer onde correct = false:
    incrementar contador em Map<questionId, { count, materia, lastSeenAt }>
Ordenar por count desc, retornar top 10
```

### Como calcular `avgTimePerQuestion`

```
avgTimePerSimuladoSeconds / (totalQuestions por simulado — média ponderada)
```

### Como calcular `srsProgress`

Requer leitura de `users/{uid}/srs_cards` — subcoleção separada de `results`. O hook `useResults` carrega apenas `results`; `srsProgress` deve ser carregado separadamente (ex: hook `useSrsProgress`).

```typescript
// useSrsProgress
const cards = await getDocs(collection(db, `users/${uid}/srs_cards`))
const mastered = cards.docs.filter(d => d.data().repetitions >= 5)
return {
  totalCards: cards.size,
  masteredCards: mastered.length,
  masteredPct: (mastered.length / cards.size) * 100
}
```

---

## Como `streak` é calculado

1. Ordena todos os resultados por `completedAt` decrescente
2. Extrai datas únicas (1 por dia)
3. Conta dias consecutivos até hoje a partir do mais recente

---

## Dados disponíveis para analytics futuro

| Dado | Onde fica | Granularidade |
|---|---|---|
| Acertos por questão | `results/{id}.answers[].correct` | Por usuário |
| Tempo por simulado | `results/{id}.timeSpentSeconds` | Por simulado |
| Área mais fraca | `results/{id}.materiaBreakdown` | Por simulado |
| Uso da revisão | `srs_cards/{id}.repetitions` | Por card |
| Retenção básica | `users/{uid}.lastActivity` | Por usuário |
| Plano atual | `users/{uid}.isPremium + planType` | Por usuário |
| Tickets premium | `premium_requests/{id}` | Por solicitação |
| Problemas reportados | `flagged_questions/{id}` | Por questão |

---

## Métricas de sistema (Firestore nativo)

Disponíveis no console Firebase sem código adicional:

- Leituras/escritas por coleção (Firestore usage)
- Latência das Cloud Functions (Cloud Console)
- Erros por function (Cloud Logging)
- Usuários ativos (Firebase Auth console)
- FCM delivery rate (Firebase console → Cloud Messaging)
