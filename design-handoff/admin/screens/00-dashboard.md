# Admin — Tela: Dashboard

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                              Atualizado há 2min [↺]   │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Usuários     │ Ativos Hoje  │ Ativos 7d    │ Ativos 30d         │
│   1.234      │     87       │    341       │    892             │
│  total       │    DAU       │    WAU       │    MAU             │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│                                                                  │
│  PLANOS                          RETENÇÃO (cohort últimos 30d)  │
│  ┌────────────────────────┐      D1  ████████░░░░  68%          │
│  │ Free     75%  ░░░░░░░  │      D7  █████░░░░░░░  41%          │
│  │ Pro      18%  ░░░      │      D30 ███░░░░░░░░░  22%          │
│  │ Pro MAX   7%  ░        │                                      │
│  └────────────────────────┘                                      │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  FUNIL PREMIUM                                                   │
│                                                                  │
│  Tickets: 142   [Aprovados: 89 ✓]  [Negados: 31 ✗]  [Pendentes: 22 ●] │
│  Taxa de aprovação: 74%     Tempo médio de aprovação: 4.2h      │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  CHURN RISK                                                      │
│  Expira em 7 dias:  18 usuários   [Ver lista]                   │
│  Expira em 30 dias: 47 usuários   [Ver lista]                   │
│  Churn confirmado:  12 usuários   [Ver lista]                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Seções

### KPIs principais (linha superior)

| Campo | Fonte | Atualização |
|---|---|---|
| Usuários totais | `getAdminDashboard().totalUsers` | Por chamada |
| DAU | `getAdminDashboard().dau` | Por chamada |
| WAU | `getAdminDashboard().wau` | Por chamada |
| MAU | `getAdminDashboard().mau` | Por chamada |

### Planos

Barras horizontais proporcionais baseadas em `usersByPlan`. Exibe contagem absoluta e percentual.

### Retenção

Barras de progresso para D1/D7/D30. Tooltip explica: "% dos usuários que criaram conta nos últimos 30 dias e voltaram a usar o app".

### Funil Premium

| Elemento | Dado |
|---|---|
| Tickets totais | `premiumFunnel.total` |
| Badges coloridos | `pending` (amarelo), `approved` (verde), `denied` (vermelho) |
| Taxa de aprovação | `premiumFunnel.approvalRatePct` |
| Tempo médio | `premiumFunnel.avgApprovalTimeHours` formatado como `Xh` ou `Xd Yh` |

Clique em qualquer badge navega para `/admin/premium` filtrado pelo status correspondente.

### Churn Risk

| Linha | Dado | Ação |
|---|---|---|
| Expira em 7 dias | `premiumExpiringIn7Days` | Navega para `/admin/usuarios` filtrado por `premiumExpiresAt <= now+7d` |
| Expira em 30 dias | `premiumExpiringIn30Days` | Navega para `/admin/usuarios` filtrado por `premiumExpiresAt <= now+30d` |
| Churn confirmado | `expiredPremium` | Navega para `/admin/usuarios` filtrado por `isPremium=false AND premiumExpiresAt existe` |

---

## Comportamento do botão [↺]

- Chama `getAdminDashboard()` novamente
- Exibe spinner no botão durante a chamada
- Atualiza `computedAt` → reformata como "Atualizado há Xmin" ou "Atualizado às HH:MM"

---

## Estados de carregamento

| Estado | Visual |
|---|---|
| Loading inicial | Skeletons em todas as seções |
| Erro na chamada | Banner vermelho: "Falha ao carregar métricas. Tente novamente." + botão Tentar novamente |
| Dados com >30min | Badge amarelo "Dados desatualizados" ao lado do timestamp |

---

## Acesso

Rota: `/admin` (página inicial do painel admin, antes dos outros módulos)

**Function backend**: `getAdminDashboard` (ver `functions.md`)
