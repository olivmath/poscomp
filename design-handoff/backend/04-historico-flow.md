# Backend — Fluxo 4: Histórico

Não há Cloud Function neste fluxo. O frontend lê diretamente do Firestore.

```
[Usuário abre /historico]
        │
        └── onSnapshot  users/{uid}/results
              ├── ordena por completedAt DESC (client-side)
              ├── calcula trend: delta % vs resultado anterior (client-side)
              └── renderiza lista de ResultCards

[Usuário clica em um ResultCard → /historico/:id]
        │
        └── getDoc  users/{uid}/results/{resultId}
              └── renderiza RelatorioFinal com:
                    ├── score, materiaBreakdown
                    ├── answers[] com snapshot da questão
                    └── comentario (Premium — já embutido no snapshot)
```

## Restrição de acesso (Premium)

O controle é feito no **frontend** via `isPremium` do `AuthContext`:
- Free → exibe `PaywallCard` em vez da lista
- Premium → exibe a lista normalmente

Não há verificação de premium no backend para leitura de results — as regras Firestore permitem ao dono ler `users/{uid}/results/*` sem restrição.

## Cálculo de métricas (client-side)

Tudo calculado pelo hook `useResults` a partir dos documentos lidos:

| Métrica             | Como é calculada                                              |
|---------------------|---------------------------------------------------------------|
| Trend `+5%`         | `(score/total atual) - (score/total anterior)` em %          |
| `byMateria`         | acumulado de `materiaBreakdown` de todos os resultados        |
| `streak`            | dias consecutivos com `completedAt` até hoje                  |
| `activeDaysThisWeek`| datas únicas dos últimos 7 dias com resultado                 |

**Nota**: `activeDays` no `UserDocument` (atualizado pelo backend) é usado pelo WeekHeader. O `streak` do hook `useResults` é calculado client-side a partir dos resultados — pode divergir do `activeDays` se o usuário fez revisão mas não simulado no dia.
