# Cloud Functions — Referência Completa

Todas as functions são `onCall` (Firebase Callable) exceto onde indicado.
Chamadas via SDK: `httpsCallable(functions, 'nomeDaFunction')(payload)`.
Não há REST endpoints — não há URL pública direta.

---

## Convenções

**Autenticação**: toda function verifica `request.auth`. Se ausente → `unauthenticated`.
**Admin**: functions admin verificam `request.auth.token.admin === true` → `permission-denied`.
**Erros**: todos retornam `HttpsError` com código padrão Firebase (`unauthenticated`, `invalid-argument`, `not-found`, `internal`, `permission-denied`, `failed-precondition`).
**Logs**: toda function loga `started` no início e `finished` no fim com `uid` e métricas chave.

---

## Grupo: Simulado

### `getSimuladoQuestions`

**Auth**: usuário autenticado

**Input**:
```typescript
{
  materias: Materia[]    // [] = todas as matérias
  total: number    // número de questões (inteiro positivo)
}
```

**Output**:
```typescript
{
  questions: Question[]   // array embaralhado, sliced em `total`
}
```

**Validações**:
- `total` deve ser inteiro positivo
- `materias` deve conter apenas valores de `VALID_MATERIAS`

**Comportamento**:
1. Busca questões no Firestore filtrando por matéria (ou tudo se `materias = []`)
2. Embaralha com Fisher-Yates simplificado (`sort(() => Math.random() - 0.5)`)
3. Retorna os primeiros `total` elementos

**Erros possíveis**:
- `not-found`: nenhuma questão encontrada para as áreas selecionadas
- `internal`: falha no Firestore

---

### `finishSimulado`

**Auth**: usuário autenticado

**Input**:
```typescript
{
  answers: Array<{
    questionId: number
    selected: Option        // 'A'|'B'|'C'|'D'|'E'
    confidence: Confidence  // 'unsure'|'studying'|'should_know'
  }>
  timeSpentSeconds: number
}
```

**Output**:
```typescript
{
  resultId: string
  score: number
  totalQuestions: number
  timeSpentSeconds: number
  materiaBreakdown: Record<Materia, { correct: number; total: number }>
  answers: AnswerOutput[]
}
```

**Side effects** (tudo em paralelo onde possível):
1. Salva `users/{uid}/results/{resultId}` com o resultado completo
2. Atualiza `users/{uid}.lastActivity` = serverTimestamp e faz union de `today` em `activeDays`
3. Batch-update/set `users/{uid}/srs_cards/{questionId}` para cada resposta:
   - Se card não existe: cria com valores iniciais SM-2 (`easeFactor=2.5`, `interval=1`, `repetitions=0`, `dueDate=now`) + `materia` copiado do snapshot da questão
   - Se card existe e `studied === false` (nunca foi revisado): atualiza `lastConfidence`, `dueDate=now`, `simuladoCorrect`, `materia`
   - Se card existe e `studied === true` (já foi revisado): atualiza apenas `lastConfidence`, `simuladoCorrect`, `materia` — **não sobrescreve `dueDate`** (preserva o intervalo SM-2 calculado por `reviewCard`)

**Validações**:
- `answers` não pode ser vazio
- `timeSpentSeconds >= 0`
- Cada `selected` deve estar em `VALID_OPTIONS`
- Cada `confidence` deve estar em `VALID_CONFIDENCES`
- Cada `questionId` deve ser inteiro positivo
- Todas as `questionId` devem existir no Firestore (throws `not-found` se alguma faltar)

**Atenção — limite Firestore**: questões são buscadas em chunks de 30 (limite do operador `in`).

---

## Grupo: Histórico

### `getHistorico`

**Auth**: usuário autenticado + Premium

**Input**: nenhum

**Output**:
```typescript
{
  results: Array<{
    resultId: string
    score: number
    totalQuestions: number
    completedAt: string       // ISO 8601
    materiaBreakdown: Record<Materia, { correct: number; total: number }>
  }>
  trend: number | null        // delta % vs resultado anterior; null se só 1 resultado
  byMateria: Record<Materia, { correct: number; total: number }>
  streak: number              // dias consecutivos com completedAt até hoje
  activeDaysThisWeek: string[] // datas únicas dos últimos 7 dias com resultado
}
```

**Comportamento**:
1. Lê `users/{uid}.isPremium` → lança `permission-denied` se `false`
2. Busca `users/{uid}/results`, ordena por `completedAt DESC`
3. Calcula métricas (trend, byMateria, streak, activeDaysThisWeek) server-side
4. Retorna lista e métricas

**Erros possíveis**:
- `permission-denied`: usuário free
- `internal`: falha no Firestore

---

### `getResult`

**Auth**: usuário autenticado + Premium

**Input**: `{ resultId: string }`

**Output**:
```typescript
{
  resultId: string
  score: number
  totalQuestions: number
  timeSpentSeconds: number
  completedAt: string
  materiaBreakdown: Record<Materia, { correct: number; total: number }>
  answers: Array<{
    questionId: number
    selected: 'A' | 'B' | 'C' | 'D' | 'E'
    correct: boolean
    confidence: 'unsure' | 'studying' | 'should_know'
    question: {
      id: number
      materia: string
      enunciado: string
      alternativas: Record<string, string>
      resposta: string
      comentario: string    // Premium — já embutido no snapshot
    }
  }>
}
```

**Comportamento**:
1. Lê `users/{uid}.isPremium` → lança `permission-denied` se `false`
2. Busca `users/{uid}/results/{resultId}` → lança `not-found` se inexistente
3. Retorna documento completo

**Erros possíveis**:
- `permission-denied`: usuário free
- `not-found`: resultId inválido ou não pertence ao usuário
- `internal`: falha no Firestore

---

## Grupo: Revisão Espaçada (SRS)

### `getPendingCards`

**Auth**: usuário autenticado

**Input**: nenhum

**Output**:
```typescript
{
  cards: Array<{
    questionId: number
    priority: 'P1' | 'P2'
    lastConfidence: Confidence
    dueDate: string           // ISO 8601
    repetitions: number
    easeFactor: number
    interval: number
    question: FullQuestionView
  }>
}
```

**Comportamento**:
1. Busca todos os `srs_cards` onde `dueDate <= now`
2. Filtra cards sem `lastConfidence` e cards com `lastConfidence = 'unsure'` (P3 não entra na fila)
3. Mapeia confiança → prioridade: `should_know → P1`, `studying → P2`
4. Ordena: P1 antes de P2, empate por `dueDate` mais antiga primeiro
5. Hydrata com dados da questão (busca em chunks de 30)

---

### `getMateriaReviewStats`

**Auth**: usuário autenticado

**Input**: nenhum

**Output**:
```typescript
{
  materias: Array<{
    materia: string                  // nome da matéria
    reviewDates: string[]         // ISO 8601 — datas dos simulados que cobriram essa matéria
    nextDueDate: string | null    // ISO 8601 — menor dueDate dos srs_cards da matéria
  }>
  // ordenado por nextDueDate ASC (mais urgente primeiro); null vai por último
}
```

**Comportamento**:
1. Busca todos os `srs_cards` do usuário, agrupa por `materia`, extrai `min(dueDate)` por matéria
2. Busca todos os `results` do usuário (sem limite — histórico completo), extrai `completedAt` agrupados pelas matérias presentes em `materiaBreakdown`
3. Monta e ordena: `nextDueDate` mais próxima primeiro; matérias sem cards SRS não aparecem
4. `reviewDates` retorna no máximo as **últimas 10 datas** por matéria (mais antigas descartadas)

**Erros possíveis**:
- `internal`: falha no Firestore

---

### `reviewCard`

**Auth**: usuário autenticado

**Input**:
```typescript
{
  questionId: number
  studied: boolean   // true = acertei, false = errei
}
```

**Output**:
```typescript
{
  nextDueDays: number     // intervalo em dias calculado pelo SM-2
  nextDueDate: string     // ISO 8601
  newInterval: number
  newEaseFactor: number
  newRepetitions: number
}
```

**Comportamento** (transação Firestore):
1. Aplica algoritmo SM-2 (ver `algorithm-sm2.md`)
2. Atualiza `srs_cards/{questionId}`: interval, easeFactor, repetitions, dueDate, studied=true
3. Atualiza `users/{uid}.lastActivity = now` e faz union de `today` em `activeDays`

**Erros possíveis**:
- `not-found`: card não existe (questão nunca respondida num simulado)

---

### `getPendingCount`

**Auth**: usuário autenticado

**Input**: nenhum

**Output**:
```typescript
{ count: number }
```

**Comportamento**:
1. Busca `srs_cards` onde `dueDate <= now` e `lastConfidence IN ['should_know', 'studying']`
2. Retorna apenas o count — sem hydrate de questão

**Uso**: badge de cards pendentes no BottomNav (evita chamar `getPendingCards` completo só para o número)

---

## Grupo: Billing (usuário)

### `getPixConfig`

**Auth**: usuário autenticado

**Input**:
```typescript
{ planType: 'pro' | 'pro_max' }
```

**Output**:
```typescript
{
  transactionId: string   // ID da cobrança criada — deve ser repassado a submitPremiumRequest
  pixQrBase64: string     // QR code PNG 200×200 em base64
  pixCopyPaste: string    // string PIX Copia e Cola
}
```

**Comportamento**:
1. Lê `PIX_KEY` de variável de ambiente (nunca exposta ao cliente)
2. Gera `transactionId` único
3. Cria `premium_requests/{transactionId}` com `status='awaiting_receipt'`, `planType`, `uid`
4. Gera QR code e PIX Copia e Cola server-side
5. Retorna `transactionId` + dados do PIX

**Erros possíveis**:
- `invalid-argument`: `planType` inválido
- `internal`: falha ao gravar cobrança ou gerar QR

---

### `submitPremiumRequest`

**Auth**: usuário autenticado

**Input**:
```typescript
{
  transactionId: string   // ID retornado por getPixConfig
  fileBase64: string      // comprovante codificado em base64
  receiptType: string     // MIME type: image/* ou application/pdf
}
```

**Output**: `{ success: true }`

**Validações de segurança**:
- `transactionId` deve existir em `premium_requests` e pertencer ao `uid`
- `status` deve ser `'awaiting_receipt'` (impede re-submit)
- `receiptType` deve ser `image/*` ou `application/pdf`

**Comportamento**:
1. Valida `transactionId` e `status`
2. Salva arquivo no Storage via admin SDK: `receipts/{uid}/{transactionId}_{filename}`
3. Atualiza `premium_requests/{transactionId}`: `status='pending'`, `storagePath`, `receiptType`, `submittedAt`
4. Retorna `{ success: true }`
   → dispara trigger `onPremiumRequestCreated` (apenas log)

---

## Grupo: Conta (usuário)

### `deleteAllData`

**Auth**: usuário autenticado

**Input**: nenhum

**Output**: `{ deleted: true }`

**Side effects**: deleta em batch (400 docs por batch) as coleções:
- `users/{uid}/srs_cards` — todos os cards SRS
- `users/{uid}/results` — todo o histórico de simulados

**Não** deleta: o documento `users/{uid}` raiz (perfil, premium, FCM tokens).

---

### `reportQuestion`

**Auth**: usuário autenticado

**Input**: `{ questionId: number, comment?: string }`

**Comportamento**: cria `flagged_questions/{id}` standalone (não vinculado a um simulado).

---

## Grupo: Admin — Dashboard

### `getAdminDashboard`

**Auth**: admin

**Input**: nenhum

**Output**:
```typescript
{
  // Usuários
  totalUsers: number
  usersByPlan: { free: number; pro: number; pro_max: number }

  // Atividade (rolling)
  dau: number      // lastActivity >= hoje 00:00 BRT
  wau: number      // lastActivity >= 7 dias atrás
  mau: number      // lastActivity >= 30 dias atrás

  // Retenção por cohort (usuários criados nos últimos 30 dias)
  retention: {
    d1: number     // % com atividade em D+1 após cadastro
    d7: number     // % com atividade em D+2..7
    d30: number    // % com atividade em D+8..30
  }

  // Funil de conversão premium
  premiumFunnel: {
    total: number
    pending: number
    approved: number
    denied: number
    approvalRatePct: number          // approved / (approved + denied) * 100
    avgApprovalTimeHours: number     // média de reviewedAt - createdAt nos aprovados
  }

  // Risco de churn
  premiumExpiringIn7Days: number
  premiumExpiringIn30Days: number
  expiredPremium: number             // isPremium=false AND premiumExpiresAt existe

  computedAt: Timestamp
}
```

**Comportamento**:
1. Busca todos os documentos `users/` em paralelo com `premium_requests/`
2. Para `totalUsers`: usa `listUsers()` do Firebase Auth Admin SDK (paginado, sem limite)
3. Para `usersByPlan`, `dau`, `wau`, `mau`, churn: deriva dos documentos `users/`
4. Para `retention`: filtra users com `createdAt >= now-30d`, verifica presença de datas em `activeDays[]`
5. Para `premiumFunnel`: agrega `premium_requests` por `status`; calcula média de `(reviewedAt.toMillis() - createdAt.toMillis()) / 3_600_000` nos aprovados
6. Retorna com `computedAt = serverTimestamp()`

**Custo estimado**: ~2N leituras (N = total de usuários) + M leituras (M = tickets premium). Para >50k usuários, substituir por job scheduled que escreve em `metrics/dashboard`.

**Erros possíveis**:
- `internal`: falha no Firestore ou no Firebase Auth Admin SDK

---

## Grupo: Admin — Premium

### `reviewPremiumRequest`

**Auth**: admin

**Input**:
```typescript
{
  requestId: string
  action: 'approve' | 'deny'
}
```

**Output**: `{ success: true }`

**Comportamento** (approve):
1. Calcula `premiumExpiresAt`: pro = +30 dias, pro_max = +365 dias
2. Atualiza `users/{uid}`: `isPremium=true`, `planType`, `premiumExpiresAt`
3. Atualiza `premium_requests/{id}`: `status='approved'`, `reviewedAt`, `reviewedBy`
4. Envia push notification (fire-and-forget, falha não bloqueia a aprovação)

**Comportamento** (deny):
1. Atualiza `premium_requests/{id}`: `status='denied'`, `reviewedAt`, `reviewedBy`
2. **Não** altera o documento `users/{uid}`

**Precondição**: ticket deve estar com `status='pending'` → `failed-precondition` se já processado.

---

## Grupo: Admin — Usuários

### `setAdminRole` / `revokeAdminRole`

**Auth**: admin

**Input**: `{ uid: string }`

**Comportamento**: seta/revoga custom claim `{ admin: true/false }` via Firebase Auth Admin SDK.

---

### `listUsers`

**Auth**: admin

**Input**: `{ pageToken?: string }`

**Output**: lista paginada (100 por página) com `uid, email, displayName, photoURL, disabled, isAdmin, createdAt, lastSignIn`.

---

### `disableUser` / `enableUser`

**Auth**: admin

**Input**: `{ uid: string }`

**Comportamento**: altera `disabled` no Firebase Auth. Usuário desabilitado não consegue fazer login.

---

### `resetUserSrs`

**Auth**: admin

**Input**: `{ uid: string }`

**Comportamento**: deleta todos os documentos em `users/{uid}/srs_cards`.

**Output**: `{ success: true, deleted: number }`

---

### `grantPremiumAdmin`

**Auth**: admin

**Input**: `{ uid: string, planType: 'pro' | 'pro_max' }`

**Comportamento**: concede premium diretamente sem necessidade de comprovante:
- pro → +30 dias
- pro_max → +365 dias

---

## Grupo: Admin — Questões

### `createQuestion`

**Auth**: admin

**Input**: todos os campos de `Question` exceto `id`

**Comportamento**: busca o maior `id` existente, incrementa, salva com `doc(String(nextId)).set(...)`.

**Output**: `{ id: number }`

---

### `updateQuestion`

**Auth**: admin

**Input**: `{ id: number, ...campos parciais de Question }`

**Output**: `{ success: true }`

---

### `deleteQuestion`

**Auth**: admin

**Input**: `{ id: number }`

**Não** deleta os SRS cards dos usuários — cards órfãos ficam no Firestore (tech debt).

---

## Grupo: Admin — Flags

### `getFlaggedQuestions`

**Auth**: usuário autenticado (deveria ser admin — ver tech-debt)

**Input**: nenhum

**Output**: todos os `flagged_questions` onde `resolved = false`

---

### `resolveFlaggedQuestion`

**Auth**: usuário autenticado (deveria ser admin — ver tech-debt)

**Input**: `{ id: string }`

**Comportamento**: seta `resolved=true` e `resolvedAt=serverTimestamp`.

---

### `deleteFlaggedQuestion`

**Auth**: admin

**Input**: `{ id: string }`

---

## Grupo: Admin — Announcements

### `createAnnouncement`

**Auth**: admin

**Input**:
```typescript
{
  message: string
  type: 'info' | 'warning' | 'success'
  active: boolean
  url?: string | null
  expiresAt?: string | null  // ISO string
}
```

**Comportamento**: cria o documento. Múltiplos announcements podem ter `active=true` simultaneamente — sem batch de desativação.

---

### `updateAnnouncement`

**Auth**: admin

**Input**: `{ id: string, ...campos parciais }`

**Comportamento**: atualiza campos parciais. Sem lógica de exclusividade — `active` de outros documentos não é alterado.

---

### `deleteAnnouncement`

**Auth**: admin

**Input**: `{ id: string }`

---

## Grupo: Background — Triggers

### `onPremiumRequestCreated` ← Firestore Trigger

**Tipo**: `onDocumentCreated('premium_requests/{requestId}')`
**Propósito**: apenas logging do novo ticket. Sem side effects no banco.

---

## Grupo: Background — Scheduled

Ver `notifications.md` para detalhes.

| Function                   | Schedule (UTC)     | Horário BRT |
|----------------------------|--------------------|-------------|
| sendReviewReminder         | `0 12 * * *`       | 9h diário   |
| sendStreakReminder          | `0 0 * * *`        | 21h diário  |
| sendWeeklySimuladoReminder | `0 12 * * 1`       | 9h segunda  |
