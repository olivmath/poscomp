# Backend — Fluxo 4: Histórico

Histórico é recurso **Premium**. Todo acesso passa por Cloud Function — o frontend não lê `results` diretamente do Firestore.

```
[Usuário abre /historico]
        │
        ▼
getHistorico()
  ├── Verifica auth → unauthenticated se ausente
  ├── Lê users/{uid}.isPremium → permission-denied se free
  ├── Busca users/{uid}/results, ordena por completedAt DESC
  ├── Calcula trend: delta % vs resultado anterior
  └── retorna results[], trend, byMateria, streak, activeDaysThisWeek

[Usuário clica em um ResultCard → /historico/:id]
        │
        ▼
getResult({ resultId })
  ├── Verifica auth → unauthenticated se ausente
  ├── Lê users/{uid}.isPremium → permission-denied se free
  ├── Busca users/{uid}/results/{resultId} → not-found se inexistente
  └── retorna score, materiaBreakdown, answers[] (snapshot + comentario)
```

## Restrição de acesso (Premium)

Verificação feita no **backend**, não no frontend:
- Free → `permission-denied` (frontend exibe `PaywallCard` com base no erro)
- Premium → retorna dados normalmente

Regras Firestore bloqueiam leitura direta de `users/{uid}/results/*` pelo cliente — acesso só via Cloud Function.

## Cálculo de métricas (backend)

Calculado por `getHistorico` antes de retornar:

| Métrica             | Como é calculada                                              |
|---------------------|---------------------------------------------------------------|
| Trend `+5%`         | `(score/total atual) - (score/total anterior)` em %          |
| `byMateria`         | acumulado de `materiaBreakdown` de todos os resultados        |
| `streak`            | dias consecutivos com `completedAt` até hoje                  |
| `activeDaysThisWeek`| datas únicas dos últimos 7 dias com resultado                 |

**Nota**: `activeDays` no `UserDocument` (atualizado pelo backend em `finishSimulado` e `reviewCard`) é usado pelo WeekHeader via push — não via leitura direta.
