# SRS Upsert após Simulado — Diagrama de Sequência

Detalha o que acontece dentro de `upsertFromResult()` quando o simulado termina.

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ useSimulado │   │    useSrs    │   │  Firestore   │
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                  │
       │ upsertFromResult│                  │
       │ (result)        │                  │
       │────────────────>│                  │
       │                 │ GET srs_cards    │
       │                 │─────────────────>│
       │                 │<─────────────────│
       │                 │ monta existingMap│
       │                 │                  │
       │                 │ [para cada answer]
       │                 │                  │
       │                 │ needsReview?     │
       │                 │ (errou OU conf   │
       │                 │  != null)        │
       │                 │                  │
       │                 │  ┌── SIM ────────┤
       │                 │  │               │
       │                 │  │ já existe?    │
       │                 │  │               │
       │                 │  ├── SIM: atualiza confidence
       │                 │  │        dueDate = agora
       │                 │  │        (SM-2 avança na revisão)
       │                 │  │               │
       │                 │  └── NÃO: buildNewCard()
       │                 │        easeFactor=2.5
       │                 │        interval=1
       │                 │        repetitions=0
       │                 │                  │
       │                 │ Promise.all(writes)
       │                 │─────────────────>│
       │                 │  SET /srs_cards/{qid} (merge)
       │                 │<─────────────────│
       │                 │                  │
       │                 │ loadPendingCards()
       │                 │─────────────────>│
       │                 │<─────────────────│
       │<────────────────│                  │
```

## Regra de entrada no SRS

```
answer.correct = false   →  entra (errou)
answer.confidence != null →  entra (classificou confiança)
answer.correct = true
  + confidence = null    →  NÃO entra (acertou sem classificar)
```

## Diferença simulado vs revisão no SRS

| Momento | O que muda no card |
|---------|-------------------|
| Simulado (`upsertFromResult`) | `lastConfidence` + `dueDate = agora` |
| Revisão (`updateCard`) | SM-2 avança: `interval`, `easeFactor`, `repetitions`, `dueDate` futura |
