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
  └── [a qualquer momento, se reportar uma questão]
        └── reportQuestion({ questionId, comment? })
              └── Cria flagged_questions/{id} imediatamente
                  (não aguarda o fim do simulado; não é re-enviado em finishSimulado)
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
  │    └── Batch-upsert srs_cards/{questionId} para cada resposta:
  │          ├── Se novo: easeFactor=2.5, interval=1, repetitions=0, materia
  │          └── Se existe: atualiza lastConfidence, dueDate=now, simuladoCorrect, materia
  │
  └── retorna resultId, score, materiaBreakdown, answers[]
```

## Acesso a dados pós-simulado

O frontend **não lê Firestore diretamente** — toda leitura passa pelo backend:

| Dado                        | Como obtém                                                                 |
|-----------------------------|----------------------------------------------------------------------------|
| Resultado do simulado       | Resposta de `finishSimulado` (retorna `resultId, score, materiaBreakdown, answers[]`) |
| Announcements (carousel)    | Recebidos via push do backend (não onSnapshot client-side); backend filtra `active=true` e `expiresAt > now` antes de entregar |

## Dados gravados por `finishSimulado`

| Destino                          | O que grava                                    |
|----------------------------------|------------------------------------------------|
| `results/{resultId}`             | resultado completo com snapshot das questões   |
| `users/{uid}.activeDays`         | arrayUnion com data de hoje (`YYYY-MM-DD`)     |
| `users/{uid}.lastActivity`       | serverTimestamp                                |
| `srs_cards/{questionId}`         | estado SM-2 inicial + materia + lastConfidence |
| `flagged_questions/{id}`         | criado por `reportQuestion` durante o simulado (não por `finishSimulado`) |
