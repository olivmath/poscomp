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
  areas: Area[]    // [] = todas as áreas
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
- `areas` deve conter apenas valores de `VALID_AREAS`

**Comportamento**:
1. Busca questões no Firestore filtrando por área (ou tudo se `areas = []`)
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
    issue?: { comment?: string }
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
  areaBreakdown: Record<Area, { correct: number; total: number }>
  answers: AnswerOutput[]
}
```

**Side effects** (tudo em paralelo onde possível):
1. Salva `users/{uid}/results/{resultId}` com o resultado completo
2. Atualiza `users/{uid}.lastActivity` = serverTimestamp
3. Para cada questão com `issue`: cria `flagged_questions/{id}`
4. Batch-update/set `users/{uid}/srs_cards/{questionId}` para cada resposta:
   - Se card já existe: atualiza `lastConfidence`, `dueDate = now`, `simuladoCorrect`
   - Se card não existe: cria com valores iniciais SM-2 (`easeFactor=2.5`, `interval=1`, `repetitions=0`)

**Validações**:
- `answers` não pode ser vazio
- `timeSpentSeconds >= 0`
- Cada `selected` deve estar em `VALID_OPTIONS`
- Cada `confidence` deve estar em `VALID_CONFIDENCES`
- Cada `questionId` deve ser inteiro positivo
- Todas as `questionId` devem existir no Firestore (throws `not-found` se alguma faltar)

**Atenção — limite Firestore**: questões são buscadas em chunks de 30 (limite do operador `in`).

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
    priority: 'P1' | 'P2' | 'P3'
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
2. Filtra cards sem `lastConfidence` (não devem aparecer na fila)
3. Mapeia confiança → prioridade: `should_know → P1`, `studying → P2`, `unsure → P3`
4. Ordena: P1 antes de P2 antes de P3, empate por `dueDate` mais antiga primeiro
5. Hydrata com dados da questão (busca em chunks de 30)

---

### `getAreaReviewStats`

**Auth**: usuário autenticado

**Input**: nenhum

**Output**:
```typescript
{
  areas: Array<{
    area: string                  // nome da área
    reviewDates: string[]         // ISO 8601 — datas dos simulados que cobriram essa área
    nextDueDate: string | null    // ISO 8601 — menor dueDate dos srs_cards da área
  }>
  // ordenado por nextDueDate ASC (mais urgente primeiro); null vai por último
}
```

**Comportamento**:
1. Busca todos os `srs_cards` do usuário, agrupa por `area`, extrai `min(dueDate)` por área
2. Busca todos os `results` do usuário, extrai `completedAt` agrupados pelas áreas presentes em `areaBreakdown`
3. Monta e ordena: `nextDueDate` mais próxima primeiro; áreas sem cards SRS não aparecem

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
3. Atualiza `users/{uid}.lastActivity = now`

**Erros possíveis**:
- `not-found`: card não existe (questão nunca respondida num simulado)

---

## Grupo: Conta

### `deleteAllData`

**Auth**: usuário autenticado

**Input**: nenhum

**Output**: `{ deleted: true }`

**Side effects**: deleta em batch (400 docs por batch) as coleções:
- `users/{uid}/srs_cards` — todos os cards SRS
- `users/{uid}/results` — todo o histórico de simulados

**Não** deleta: o documento `users/{uid}` raiz (perfil, premium, FCM tokens).

---

## Grupo: Billing / Premium

### `submitPremiumRequest`

**Auth**: usuário autenticado

**Input**:
```typescript
{
  storagePath: string   // ex: "receipts/{uid}/1234567890_comprovante.jpg"
  receiptType: string   // MIME type do arquivo
  planType: 'pro' | 'pro_max'
}
```

**Output**: `{ requestId: string }`

**Validações de segurança**:
- `storagePath` deve começar com `receipts/{uid}/` — impede que um usuário submeta comprovante de outro
- `planType` deve ser `pro` ou `pro_max`

**Comportamento**:
1. Gera Signed URL do arquivo no Storage (expira em 2099)
2. Cria documento em `premium_requests/{id}` com status `pending`

---

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

### `onPremiumRequestCreated` ← Firestore Trigger

**Tipo**: `onDocumentCreated('premium_requests/{requestId}')`
**Propósito**: apenas logging do novo ticket. Sem side effects no banco.

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

### `reportQuestion`

**Auth**: usuário autenticado

**Input**: `{ questionId: number, comment?: string }`

**Comportamento**: cria `flagged_questions/{id}` standalone (não vinculado a um simulado).

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

**Invariante**: se `active=true`, desativa todos os outros antes de criar.

---

### `updateAnnouncement`

**Auth**: admin

**Input**: `{ id: string, ...campos parciais }`

**Invariante**: se `active=true`, desativa todos os outros antes de atualizar.

---

### `deleteAnnouncement`

**Auth**: admin

**Input**: `{ id: string }`

---

## Grupo: Notificações (Scheduled)

Ver `notifications.md` para detalhes.

| Function                   | Schedule (UTC)     | Horário BRT |
|----------------------------|--------------------|-------------|
| sendReviewReminder         | `0 12 * * *`       | 9h diário   |
| sendStreakReminder          | `0 0 * * *`        | 21h diário  |
| sendWeeklySimuladoReminder | `0 12 * * 1`       | 9h segunda  |
