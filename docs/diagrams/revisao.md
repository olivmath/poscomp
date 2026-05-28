# Revisão (SRS) — Diagrama de Sequência

```
┌──────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ Usuário  │   │ useRevisao  │   │  SrsContext  │   │  Firestore   │
└────┬─────┘   └──────┬──────┘   └──────┬───────┘   └──────┬───────┘
     │                │                 │                   │
     │  Abre /revisao │                 │                   │
     │───────────────>│                 │                   │
     │                │ pendingCards    │                   │
     │                │<────────────────│                   │
     │                │                 │                   │
     │                │ fetch questions │                   │
     │                │ por IDs dos     │                   │
     │                │ cards pendentes │                   │
     │                │─────────────────────────────────── >│
     │                │  GET /questions?id IN [...]         │
     │                │<────────────────────────────────── ─│
     │                │                 │                   │
     │                │ sortedCards:    │                   │
     │                │ P1 (should_know)│                   │
     │                │ P2 (studying)   │                   │
     │                │ P3 (unsure)     │                   │
     │                │                 │                   │
     │  [para cada card]                │                   │
     │                │                 │                   │
     │  reveal()      │                 │                   │
     │───────────────>│                 │                   │
     │                │ showAnswer=true │                   │
     │<───────────────│                 │                   │
     │                │                 │                   │
     │  submit(true   │                 │                   │
     │    ou false)   │                 │                   │
     │───────────────>│                 │                   │
     │                │ gradeFromResult │                   │
     │                │ sm2Update(card, │                   │
     │                │   grade)        │                   │
     │                │ updateCard()    │                   │
     │                │─────────────────────────────────── >│
     │                │  SET /users/{uid}/srs_cards/{qid}  │
     │                │<────────────────────────────────── ─│
     │                │ loadPendingCards│                   │
     │                │────────────────>│                   │
     │                │                 │──────────────────>│
     │                │                 │<──────────────────│
     │                │                 │                   │
     │  [último card] │                 │                   │
     │                │ state='finished'│                   │
     │<───────────────│                 │                   │
```

## Prioridade de revisão

```
P1 (should_know) → P2 (studying) → P3 (unsure)
     "Devia saber"     "Estudando"    "Não sei"
```

Dentro de cada prioridade, ordena por `dueDate` (mais antigas primeiro).

## Algoritmo SM-2

| Estudou? | Grade | Efeito no intervalo |
|----------|-------|---------------------|
| `true`   | 5     | Aumenta (easeFactor × interval) |
| `false`  | 1     | Reseta para 1 dia |

`easeFactor` ajusta a velocidade de espaçamento por card (inicia em 2.5).
