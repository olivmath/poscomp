# Data Model — Entidades, Schemas e Relações

## Visão geral das coleções

```
Firestore
├── questions/{id}               ← banco de questões (global, imutável pelo usuário)
├── announcements/{id}           ← banners do app (global)
├── flagged_questions/{id}       ← questões reportadas (global, gerenciado por admin)
├── premium_requests/{id}        ← tickets de assinatura (global, gerenciado por admin)
└── users/{uid}                  ← perfil do usuário
    ├── srs_cards/{questionId}   ← estado de revisão de cada questão
    └── results/{resultId}       ← histórico de simulados
```

---

## Entidade: `Question`

**Coleção**: `/questions/{id}`
**ID do documento**: string numérico (`"1"`, `"2"`, ...)

```typescript
interface Question {
  id: number                          // PK numérico, auto-incrementado
  ano: number                         // ex: 2023
  materia: 'Matemática' | 'Computação' | 'Tecnologias'
  enunciado: string                   // texto da questão
  alternativas: {                     // sempre 5 opções
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'  // gabarito correto
  comentario: string                 // explicação/resolução (Premium)
  card: {
    pergunta: string                  // versão resumida para flashcard
    resposta: string                  // resposta do flashcard (markdown)
  }
}
```

**Regras de acesso**:
- Leitura: qualquer usuário autenticado
- Escrita: somente admin (via `createQuestion`, `updateQuestion`, `deleteQuestion`)

**Indexação necessária**:
- `materia` (where-in para filtro por matéria)
- `id desc` (para auto-incremento no `createQuestion`)

---

## Entidade: `User` (documento raiz)

**Coleção**: `/users/{uid}`
**ID do documento**: Firebase Auth UID

```typescript
interface UserDocument {
  // ── Campos de premium ──────────────────────────────────────────
  isPremium: boolean                  // true se assinante ativo
  planType: 'free' | 'pro' | 'pro_max'
  premiumStatus: 'free' | 'pending' | 'active'
  premiumExpiresAt?: Timestamp        // data de expiração da assinatura

  // ── Campos de atividade ────────────────────────────────────────
  lastActivity: Timestamp             // último simulado ou revisão
                                      // atualizado por: finishSimulado, reviewCard
  activeDays: string[]                // datas com atividade no formato 'YYYY-MM-DD'
                                      // atualizado por: finishSimulado, reviewCard (union com o dia atual)
                                      // usado pelo WeekHeader para pintar os círculos dos últimos 7 dias

  // ── Campos de notificações ─────────────────────────────────────
  notificationsEnabled: boolean       // opt-in global para push
  fcmTokens: string[]                 // tokens FCM (pode ter múltiplos devices)
                                      // tokens inválidos são auto-removidos pelo sendPush
}
```

**Notas**:
- O documento `users/{uid}` **nunca é criado explicitamente** no login — ele é criado/atualizado com `set({ ... }, { merge: true })` quando o primeiro simulado é finalizado ou quando premium é concedido.
- Campos de premium são escritos exclusivamente pelas Cloud Functions (admin SDK bypassa regras).

---

## Entidade: `SrsCard`

**Coleção**: `/users/{uid}/srs_cards/{questionId}`
**ID do documento**: `questionId` como string (ex: `"42"`)

```typescript
interface SrsCard {
  questionId: number                  // FK para questions/{id}

  // ── Parâmetros SM-2 ────────────────────────────────────────────
  easeFactor: number                  // fator de facilidade, inicial = 2.5
  interval: number                    // intervalo atual em dias, inicial = 1
  repetitions: number                 // nº de revisões bem-sucedidas, inicial = 0

  // ── Agendamento ────────────────────────────────────────────────
  dueDate: Timestamp                  // data em que deve ser revisado
  createdAt: Timestamp                // criado por finishSimulado

  // ── Estado ────────────────────────────────────────────────────
  lastConfidence: 'unsure' | 'studying' | 'should_know'
  studied: boolean                    // true após pelo menos 1 reviewCard
  simuladoCorrect: boolean            // se acertou no simulado que criou o card

  // ── Denormalização ─────────────────────────────────────────────
  // copiado de questions/{questionId}.materia em finishSimulado
  // permite query por matéria sem join com questions
  materia: 'Matemática' | 'Computação' | 'Tecnologias' 
}
```

**Como é criado**: automaticamente por `finishSimulado` para cada questão respondida errado — inclui `materia` copiado do snapshot da questão.
**Como é atualizado**: `finishSimulado` (reseta dueDate ao now quando o simulado é refeito) e `reviewCard` (aplica SM-2 e agenda próxima revisão).

**Indexação necessária**:
- `dueDate` (where `<=` now — query principal de `getPendingCards` e notificações)
- `materia, dueDate` — composto, usado por `getMateriaReviewStats` para calcular `min(dueDate)` por matéria

---

## Entidade: `SimuladoResult`

**Coleção**: `/users/{uid}/results/{resultId}`
**ID do documento**: auto-gerado pelo Firestore

```typescript
interface SimuladoResult {
  // ── Scores ────────────────────────────────────────────────────
  score: number                       // nº de acertos
  totalQuestions: number              // nº total de questões
  timeSpentSeconds: number            // duração do simulado

  // ── Timestamps ────────────────────────────────────────────────
  completedAt: Timestamp              // serverTimestamp()

  // ── Breakdown por matéria ────────────────────────────────────────
  materiaBreakdown: {
    [materia: string]: {
      correct: number
      total: number
    }
  }

  // ── Respostas individuais ─────────────────────────────────────
  answers: Array<{
    questionId: number
    selected: 'A' | 'B' | 'C' | 'D' | 'E'
    correct: boolean
    confidence: 'unsure' | 'studying' | 'should_know'
    question: {                       // snapshot da questão no momento do simulado
      id: number
      materia: string
      enunciado: string
      alternativas: Record<string, string>
      resposta: string
      comentario: string
    }
    issue?: {
      comment?: string                // flag de problema reportado
    }
  }>

  // ── Metadado de review ────────────────────────────────────────
  questionReviews?: Array<{           // alias/compatibilidade legada
    id: number
    ano: number
    materia: string
    enunciado: string
    alternativas: Record<string, string>
    resposta: string
    comentario: string
  }>
}
```

**Metadado importante**: o campo `answers[].question` armazena um snapshot da questão no momento do simulado — isso garante que o relatório histórico não seja afetado por edições futuras no banco de questões.

---

## Entidade: `FlaggedQuestion`

**Coleção**: `/flagged_questions/{id}`
**ID do documento**: auto-gerado

```typescript
interface FlaggedQuestion {
  uid: string                         // FK: usuário que reportou
  questionId: number                  // FK: questão reportada
  resultId?: string                   // FK: simulado onde foi reportada (se via finishSimulado)
  comment: string | ''                // texto livre do problema
  resolved: boolean                   // false = pendente, true = resolvido
  createdAt: Timestamp
  resolvedAt?: Timestamp              // preenchido por resolveFlaggedQuestion
}
```

**Como é criado**: via `reportQuestion` (standalone) ou automaticamente por `finishSimulado` se o usuário flagou a questão durante o simulado.

---

## Entidade: `PremiumRequest`

**Coleção**: `/premium_requests/{id}`
**ID do documento**: auto-gerado

```typescript
interface PremiumRequest {
  uid: string                         // FK: usuário que solicitou
  status: 'pending' | 'approved' | 'denied'
  planType: 'pro' | 'pro_max'
  receiptUrl: string                  // Signed URL do comprovante no Storage (expira 2099)
  receiptType: string | null          // MIME type (image/jpeg, application/pdf, etc.)
  createdAt: Timestamp
  reviewedAt?: Timestamp              // preenchido por reviewPremiumRequest
  reviewedBy?: string                 // UID do admin que revisou
}
```

**Regras**:
- Criação exclusiva via Cloud Function (admin SDK bypassa regras de client-side)
- A regra Firestore só permite `read` para owner ou admin, e `update` só para admin
- Isso impede que o cliente injete uma `receiptUrl` arbitrária ou altere o status

---

## Entidade: `Announcement`

**Coleção**: `/announcements/{id}`
**ID do documento**: auto-gerado

```typescript
interface Announcement {
  message: string                     // texto do banner
  type: 'info' | 'warning' | 'success'
  active: boolean                     // múltiplos podem ser true — carousel exibe todos os ativos
  url: string | ''                    // link opcional ao clicar no banner
  createdAt: Timestamp
  expiresAt: Timestamp | null         // expiração automática (verificada no frontend)
}
```

**Carousel**: o app exibe todos os announcements com `active=true` (e `expiresAt > now`) como slides ordenados por `createdAt` ASC. Não há invariante de exclusividade — o admin controla quantos ficam ativos.

---

## Diagrama de relações

```
                    questions/{id}
                    ┌──────────────────────────────┐
                    │ id (PK)                      │
                    │ ano, materia, enunciado       │
                    │ alternativas, resposta        │
                    │ comentario?, card?            │
                   └───────────┬──────────────────┘
                                │ FK: questionId
              ┌─────────────────┼─────────────────────┐
              ▼                 ▼                     ▼
   users/{uid}/srs_cards   flagged_questions     users/{uid}/results
   /{questionId}           /{id}                /{resultId}
   ┌─────────────────┐    ┌──────────────────┐  ┌──────────────────┐
   │ questionId (FK) │    │ questionId (FK)  │  │ answers[].       │
   │ SM-2 params     │    │ uid (FK)         │  │  questionId(FK) │
   │ dueDate         │    │ comment          │  │  question(snap) │
   │ lastConfidence  │    │ resolved         │  │ score, breakdown │
  └─────────────────┘    └──────────────────┘  └──────────────────┘
              ▲
              │ parent
   users/{uid}
   ┌─────────────────────────────┐
   │ isPremium, planType         │
   │ premiumExpiresAt            │
   │ lastActivity                │
   │ notificationsEnabled        │
   │ fcmTokens[]                 │
  └─────────────────────────────┘
              │ FK: uid
              ▼
   premium_requests/{id}
   ┌─────────────────────────────┐
   │ uid (FK)                   │
   │ status, planType            │
   │ receiptUrl, receiptType     │
  └─────────────────────────────┘
```
