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
│ =                     ( )   │ ← esquerda menu sandwich; direita foto perfil leva para /perfil
│─────────────────────────────│
│                             │
│ Histórico                  │
│ 12 simulados realizados    │
│                             │
| ┌─────────────────────────────────────────┐
| │ 02/06/2026    8/10  +5%   12:34   ›     │
| │ Mat.: 90%  Comp.: 50%   Alg.: 75%       │
| └─────────────────────────────────────────┘
| ┌─────────────────────────────────────────┐
| │ 02/06/2026    8/10  +5%   12:34   ›     │
| │ Mat.: 90%  Comp.: 50%   Alg.: 75%       │
| └─────────────────────────────────────────┘
|  ...                        │
│                             │
└─────────────────────────────┘
```

## ResultCard — detalhes

```
┌──────────────────────────────────────┐
│ [data]   [score] [trend]  [tempo] ›  │ ← linha 1
│ [icon área] [área]: [pct]%           │ ← linha 2 (condicional)
└──────────────────────────────────────┘
```

- Clicável (role="button", teclado: Enter/Space)
- Área exibida = a com maior % de acerto
- Linha 2 some se não há dados de matéria breakdown
- Trend some para o primeiro simulado (sem anterior para comparar)
