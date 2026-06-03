# Admin Flow 1 — Gestão de Questões

```
[Admin abre /questoes]
        │
        └── Leitura direta: query questions (filtro por matéria/ano — client-side)

[Criar questão]
        │
        └── createQuestion({ ano, materia, enunciado, alternativas, resposta, comentario?, card? })
              ├── Busca max(id) + 1 (não atômico — tech-debt #3)
              └── Salva questions/{nextId}

[Editar questão]
        │
        └── updateQuestion({ id, ...campos parciais })
              └── Merge no documento existente

[Deletar questão]
        │
        ├── Confirmação: "Isso remove a questão permanentemente."
        └── deleteQuestion({ id })
              └── Remove questions/{id}
                    AVISO: srs_cards de usuários ficam órfãos (tech-debt #5)
```

## Impacto de uma exclusão

| O que acontece                             | Onde                        |
|--------------------------------------------|-----------------------------|
| Questão some do banco global               | `questions/{id}` deletado   |
| Cards SRS não são deletados                | `srs_cards/{questionId}` ficam órfãos |
| `getPendingCards` silencia cards órfãos    | filtra `questionsMap.has(questionId)` |
| Resultados históricos mantêm o snapshot    | `answers[].question` é imutável |
