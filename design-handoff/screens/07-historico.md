# Tela — Histórico (`/historico`)

## Estados

| State    | Visual                                         |
|----------|------------------------------------------------|
| loading  | spinner centralizado                           |
| paywall  | card lock + "Ver planos"                       |
| error    | ícone error + mensagem                         |
| empty    | ícone history + CTA "Começar Simulado"         |
| lista    | lista de ResultCards clicáveis                 |

## Layout — state: lista

```
┌─────────────────────────────┐
│                             │
│  Histórico                  │
│  12 simulados realizados    │
│                             │
│  ┌───────────────────────┐ │
│  │ 02/06  8/10 +5%  12m ›│ │  ← ResultCard
│  │ 📐 Matemática: 90%    │ │
│  └───────────────────────┘ │
│  ┌───────────────────────┐ │
│  │ 01/06  6/10 -3%  08m ›│ │
│  │ 💻 Fundamentos: 60%   │ │
│  └───────────────────────┘ │
│  ...                        │
│                             │
├─────────────────────────────┤
│  Home  Revisão  Hist  Perfil│
└─────────────────────────────┘
```

## ResultCard — detalhes

```
┌──────────────────────────────────────┐
│  [data]   [score] [trend]  [tempo] ›  │  ← linha 1
│  [icon área] [área]: [pct]%           │  ← linha 2 (condicional)
└──────────────────────────────────────┘
```

- Clicável (role="button", teclado: Enter/Space)
- Área exibida = a com maior % de acerto
- Linha 2 some se não há dados de área breakdown
- Trend some para o primeiro simulado (sem anterior para comparar)
