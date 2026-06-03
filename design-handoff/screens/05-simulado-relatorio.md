# Tela — Relatório Final (state: finished / /historico/:id)

Componente `RelatorioFinal` reutilizado em dois contextos:
1. Após simulado (Home state: finished) — botões: "Novo Simulado" + "Revisar"
2. Detalhe do histórico (`/historico/:id`) — botão: "Voltar"

## Layout

```
┌─────────────────────────────┐
│                             │
│ Seção 1 — Score            │
│      ┌───────────┐         │
│       │   72%    │         │ ← ScoreGauge (SVG circular)
│       │ 18 / 25  │         │
│      └───────────┘         │
│     24min 32seg            │
│ Na média. Revise os erros.  │
│                             │
│ Seção 2 — Distribuição     │
│  Devia saber  ████  8    │
│  Estudando    ██    4    │
│  Não sei      ██░   3    │
│                             │
│  Você tinha 8 questões que│
│ devia saber — priorize...  │
│                             │
│ Seção 3 — Por área         │
│  Matemática  7/10        │
│ ████████░░ 70%             │
│  Fundamentos 6/10        │
│ ██████░░░░ 60%             │
│  Tecnologia  5/5         │
│ ████████████ 100%          │
│                             │
│ Seção 4 — Questões         │
│ [lista expandível Q1..Qn]  │
│                             │
│ [Novo Simulado] [Revisar]  │
│                             │
├─────────────────────────────┤
│ Home  Revisão  Hist  Perfil│
└─────────────────────────────┘
```

## ScoreGauge — cores

| % de acerto | Cor          | CSS var                |
|-------------|--------------|------------------------|
| ≥ 70%       | Verde        | `--color-score-high`   |
| 50–69%      | Amarelo      | `--color-score-mid`    |
| < 50%       | Vermelho     | `--color-score-low`    |

## Tagline dinâmica

| % de acerto | Mensagem                              |
|-------------|---------------------------------------|
| ≥ 70%       | "Bom desempenho! Continue assim."     |
| 50–69%      | "Na média. Revise os erros."          |
| < 50%       | "Requer atenção. Priorize a revisão." |

## Ações (variáveis por contexto)

| Botão         | Quando aparece                        | Ação                  |
|---------------|---------------------------------------|-----------------------|
| Voltar        | em `/historico/:id`                   | navigate('/historico')|
| Novo Simulado | após simulado finalizado              | state: idle           |
| Revisar       | após simulado + score < total         | navigate('/revisao')  |

## Seção 4 — Questões (QuestionReviewList)

Lista todas as questões do simulado com:
- Número, gabarito correto, opção selecionada pelo usuário
- Indicador visual: acerto (verde) / erro (vermelho) / pulada
- Comentário explicativo (se disponível no banco — recurso premium)
