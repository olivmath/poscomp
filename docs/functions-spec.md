# Cloud Functions — Spec

## Modelo de execução

Todas as functions são **`onCall` (2nd gen)** — o SDK do Firebase injeta o `uid` autenticado automaticamente via `context.auth.uid`. O cliente **nunca envia o uid**: ele vem do token JWT verificado pelo Firebase.

```
Cliente → Firebase Auth (JWT) → Cloud Function (context.auth.uid garantido)
```

---

## Segurança

### Autenticação
Toda function começa com:
```ts
if (!context.auth) throw new HttpsError('unauthenticated', 'Login required')
const uid = context.auth.uid  // nunca aceitar uid do input
```

### Segregação de dados (Firestore)

```
/questions/{qid}              → leitura pública autenticada (banco de questões)
/users/{uid}/results/{rid}    → somente o próprio usuário lê/escreve
/users/{uid}/srs_cards/{qid}  → somente o próprio usuário lê/escreve
```

Regras Firestore que reforçam isso:
```js
match /users/{uid}/{document=**} {
  allow read, write: if request.auth.uid == uid;
}
match /questions/{qid} {
  allow read: if request.auth != null;
  allow write: if false;  // somente via Admin SDK (seed)
}
```

### Validação de input
Cada function valida o payload antes de qualquer operação no Firestore. Erros retornam `HttpsError` com código semântico — nunca stacktrace.

---

## Functions

### `getSimuladoQuestions`

Busca e embaralha questões no servidor. O cliente nunca recebe o banco completo.

**Input**
```ts
{
  areas: Area[]   // [] = todas as áreas
  total: number   // 5 | 10 | 20 | número inteiro positivo
}
```

**Validação**
- `total` deve ser inteiro > 0
- `areas` deve conter apenas valores válidos de `Area`

**Operações Firestore**
```
GET /questions  (com where area in areas, se areas.length > 0)
```

**Output**
```ts
{
  questions: Question[]   // embaralhadas e fatiadas até `total`
}
```

**Erros**
| Código | Motivo |
|--------|--------|
| `unauthenticated` | Sem token válido |
| `invalid-argument` | `total` inválido ou `areas` inválido |
| `not-found` | Nenhuma questão encontrada para os filtros |

---

### `finishSimulado`

Recebe as respostas do simulado, valida contra o gabarito (que o cliente nunca viu), salva o resultado e cria os cards SRS — tudo em um único request.

**Fluxo**
```
Cliente envia respostas → backend busca gabarito → valida → salva resultado → cria cards SRS → retorna relatório
```

**Regras do simulado**
- O simulado só pode ser submetido quando **todas** as questões foram respondidas e classificadas
- Não existe `skipped` nem `null` — o frontend bloqueia o envio até o usuário responder e classificar cada questão

**Input**
```ts
{
  answers: Array<{
    questionId: string
    selected: Option              // 'A' | 'B' | 'C' | 'D' | 'E' — sempre preenchido
    confidence: 'unsure' | 'studying' | 'should_know'  // sempre preenchido
  }>
  timeSpentSeconds: number        // >= 0
}
```

**Validação**
- `answers` não pode ser vazio
- Todo `selected` e `confidence` deve ser não-nulo
- `timeSpentSeconds` deve ser >= 0
- `correct` é calculado no servidor comparando `selected` com o gabarito do Firestore

**Operações Firestore**
```
GET  /questions?id IN [questionIds]        // busca gabarito e metadados
POST /users/{uid}/results                  // salva resultado
SET  /users/{uid}/srs_cards/{qid} (batch) // cria/atualiza cards SRS
```

**Lógica SRS — todos os cards são criados aqui, nunca reenviados pelo cliente**

Toda questão entra no SRS:
- **Existe:** atualiza `lastConfidence` + `dueDate = now`
- **Novo:** cria com `easeFactor=2.5`, `interval=1`, `repetitions=0`, `dueDate=now`

> SM-2 **não** é aplicado aqui — apenas marca como pendente para revisão. O avanço de intervalo acontece em `reviewCard`.

**Output**
```ts
{
  resultId: string
  score: number                                          // total de acertos
  totalQuestions: number
  timeSpentSeconds: number
  areaBreakdown: Record<Area, { correct: number; total: number }>
  answers: Array<{
    questionId: string
    selected: Option
    correct: boolean                                     // calculado pelo backend
    confidence: 'unsure' | 'studying' | 'should_know'
    question: {                                          // para o frontend exibir o resultado
      enunciado: string
      alternativas: Record<Option, string>
      resposta: Option
      comentario?: string
    }
  }>
}
```

**Erros**
| Código | Motivo |
|--------|--------|
| `unauthenticated` | Sem token válido |
| `invalid-argument` | Campo nulo, vazio ou tipo inválido |
| `not-found` | `questionId` não existe no banco |
| `internal` | Falha no Firestore |

---

### `getPendingCards`

Abre a sessão de revisão. O backend decide quais cards o usuário deve revisar hoje, busca as questões correspondentes e devolve tudo pronto — o frontend só exibe.

**Fluxo**
```
Frontend abre /revisao → chama getPendingCards → exibe cards na ordem recebida
```

**Input**
```ts
{}
```

**Operações Firestore**
```
GET /users/{uid}/srs_cards   where dueDate <= now
GET /questions?id IN [cardIds]
```

**Lógica de prioridade** (calculada no servidor, não no cliente)
```
lastConfidence = 'should_know' → P1  ("devia saber" — revisão urgente)
lastConfidence = 'studying'    → P2  ("estudando")
lastConfidence = 'unsure'      → P3  ("não sei")

Ordenação: P1 → P2 → P3, e dentro de cada grupo: dueDate ASC (mais atrasado primeiro)
```

**Output — array vazio = nenhuma revisão pendente**
```ts
{
  cards: Array<{
    questionId: string
    priority: 'P1' | 'P2' | 'P3'
    lastConfidence: 'unsure' | 'studying' | 'should_know'
    dueDate: string                  // ISO 8601
    repetitions: number
    easeFactor: number
    interval: number
    question: {
      id: string
      ano: number
      area: Area
      enunciado: string
      alternativas: Record<Option, string>
      resposta: Option
      comentario?: string
    }
  }>
}
```

**Erros**
| Código | Motivo |
|--------|--------|
| `unauthenticated` | Sem token válido |
| `internal` | Falha no Firestore |

---

### `reviewCard`

Registra o resultado de uma revisão e aplica o SM-2 dentro de uma **transação Firestore** — sem race condition.

O frontend chama essa function assim que o usuário responde se estudou ou não, avança para o próximo card e repete até esgotar a lista retornada por `getPendingCards`.

**Fluxo por card**
```
Exibe questão → usuário revela resposta → marca "estudei" ou "não estudei" → reviewCard() → próximo card
```

**Input**
```ts
{
  questionId: string
  studied: boolean   // true = "estudei / lembrei"  |  false = "não lembrei"
}
```

**Validação**
- `questionId` deve existir em `/users/{uid}/srs_cards`

**Operações Firestore**
```
runTransaction:
  GET /users/{uid}/srs_cards/{questionId}
  SET /users/{uid}/srs_cards/{questionId}   ← SM-2 aplicado
```

**SM-2 aplicado**
```
studied = true  (lembrou):
  interval     = round(interval × easeFactor)
  easeFactor   = easeFactor + 0.1
  repetitions  = repetitions + 1

studied = false (não lembrou):
  interval     = 1
  easeFactor   = max(1.3, easeFactor - 0.2)
  repetitions  = 0

dueDate = now + interval dias
```

**Output**
```ts
{
  nextDueDays: number      // quantos dias até a próxima revisão (para o frontend exibir)
  nextDueDate: string      // ISO 8601 da próxima revisão
  newInterval: number
  newEaseFactor: number
  newRepetitions: number
}
```

**Erros**
| Código | Motivo |
|--------|--------|
| `unauthenticated` | Sem token válido |
| `invalid-argument` | `questionId` ausente ou tipo errado |
| `not-found` | Card não existe para este usuário |
| `internal` | Falha na transação |
