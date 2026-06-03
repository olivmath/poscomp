# Admin Flow 3 — Triagem de Reports

```
[Admin abre /flags]
        │
        └── getFlaggedQuestions()
              └── retorna todos os flagged_questions WHERE resolved=false

[Admin expande um report]
        │
        ├── Lê a questão: getDoc questions/{questionId}  (client-side)
        │
        ├── [Marcar resolvido]
        │     └── resolveFlaggedQuestion({ id })
        │           └── seta resolved=true, resolvedAt=serverTimestamp
        │
        ├── [Editar questão associada]
        │     └── navega para /questoes com a questão pré-carregada
        │           └── updateQuestion({ id, ...fix })
        │
        └── [Deletar report]
              └── deleteFlaggedQuestion({ id })
```

## Triagem recomendada

1. Ler o comentário do usuário
2. Verificar a questão no banco
3. Se houver erro: editar a questão + resolver o report
4. Se report incorreto: apenas resolver (sem editar a questão)
5. Se spam: deletar o report diretamente
