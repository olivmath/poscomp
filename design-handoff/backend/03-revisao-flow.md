# Backend — Fluxo 3: Revisão Espaçada

```
[Usuário abre /revisao]
        │
        ├── getPendingCount()                ← para o badge no BottomNav
        │     └── COUNT srs_cards WHERE dueDate <= now
        │               AND lastConfidence IN ['should_know','studying']
        │         retorna { count }
        │
        └── getPendingCards()                ← para montar a fila de flashcards
              ├── query srs_cards WHERE dueDate <= now
              ├── filtra: remove lastConfidence = null e 'unsure' (P3 não entra)
              ├── mapeia: should_know → P1, studying → P2
              ├── ordena: P1 → P2, empate por dueDate ASC
              ├── hydrata: busca questions em chunks de 30
              └── retorna cards[] com priority, question, dueDate

[Usuário classifica cada card: Acertei / Errei]
        │
        ▼
reviewCard({ questionId, studied })           ← chamado a cada card
  │
  ├── [transação Firestore]
  │    ├── Aplica SM-2:
  │    │     studied=true  → interval *= easeFactor, easeFactor += 0.1, repetitions++
  │    │     studied=false → interval = 1, easeFactor = max(1.3, ef-0.2), repetitions = 0
  │    ├── Atualiza srs_cards/{questionId}: interval, easeFactor, repetitions, dueDate, studied=true
  │    └── Atualiza users/{uid}: lastActivity = now, activeDays = arrayUnion(today)
  │
  └── retorna nextDueDate, nextDueDays, newInterval, newEaseFactor, newRepetitions

[Usuário abre "Revisões por matéria"]
        │
        ▼
getMateriaReviewStats()
  ├── query srs_cards: agrupa por materia, extrai min(dueDate) por matéria
  ├── query results (histórico completo): extrai completedAt por matéria (via materiaBreakdown)
  ├── limita reviewDates a últimas 10 datas por matéria
  └── ordena por nextDueDate ASC (null por último)
```

## Regras de prioridade SM-2

| `lastConfidence` | Prioridade | Entra na fila? |
|------------------|------------|----------------|
| `should_know`    | P1         | Sim            |
| `studying`       | P2         | Sim            |
| `unsure`         | P3         | **Não**        |
| `null`           | —          | Não            |

## Índices Firestore necessários

| Coleção     | Índice                                         | Usado por               |
|-------------|------------------------------------------------|-------------------------|
| `srs_cards` | `dueDate` (simples)                            | `getPendingCards`, `getPendingCount`, notificações |
| `srs_cards` | `materia, dueDate` (composto)                  | `getMateriaReviewStats` |
