# Backend — Fluxo 2: Simulado

```
[Usuário configura simulado]
        │
        ▼
getSimuladoQuestions({ materias, total })
  ├── Firestore: query questions WHERE materia IN materias
  ├── Fisher-Yates shuffle
  └── retorna questions[0..total]
        │
[Usuário responde questões — tudo local, sem chamada ao backend]
        │
        ▼
finishSimulado({ answers, timeSpentSeconds })
  │
  ├── Valida todas as questionIds existem no Firestore (chunks de 30)
  │
  ├── [paralelo]
  │    ├── Salva users/{uid}/results/{resultId}
  │    │     └── score, breakdown, answers[], completedAt
  │    │
  │    ├── Atualiza users/{uid}
  │    │     ├── lastActivity = serverTimestamp
  │    │     └── activeDays = arrayUnion(today)
  │    │
  │    ├── Para cada questão com issue:
  │    │     └── Cria flagged_questions/{id}
  │    │
  │    └── Batch-upsert srs_cards/{questionId} para cada resposta:
  │          ├── Se novo: easeFactor=2.5, interval=1, repetitions=0, materia
  │          └── Se existe: atualiza lastConfidence, dueDate=now, simuladoCorrect, materia
  │
  └── retorna resultId, score, materiaBreakdown, answers[]
```

## Leituras diretas (sem Cloud Function)

O frontend lê diretamente do Firestore após `finishSimulado`:

| Coleção                        | Quando                          |
|--------------------------------|---------------------------------|
| `users/{uid}/results/{id}`     | tela de relatório pós-simulado  |
| `announcements` (onSnapshot)   | carousel na Home — filtra `active=true` e `expiresAt > now` client-side, ordena por `createdAt` ASC |

## Dados gravados por `finishSimulado`

| Destino                          | O que grava                                    |
|----------------------------------|------------------------------------------------|
| `results/{resultId}`             | resultado completo com snapshot das questões   |
| `users/{uid}.activeDays`         | arrayUnion com data de hoje (`YYYY-MM-DD`)     |
| `users/{uid}.lastActivity`       | serverTimestamp                                |
| `srs_cards/{questionId}`         | estado SM-2 inicial + materia + lastConfidence |
| `flagged_questions/{id}`         | apenas se o usuário reportou alguma questão    |
