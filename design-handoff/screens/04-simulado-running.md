# Tela — Simulado em Andamento (state: running)

Modo imersivo: BottomNav some. Tela toda de conteúdo.

## Layout

```
┌─────────────────────────────┐
│  [✕ Sair]   3/10   [🗺 Mapa] │  ← ImmersiveBar
│             ⏱ 1:43          │  ← timer (só se timerMode = per-question)
├─────────────────────────────┤
│ ██████░░░░░░░░░░░░░░░░░░░   │  ← progress bar (3/10 = 30%)
├─────────────────────────────┤
│                             │
│  Qual é a complexidade do   │
│  algoritmo de ordenação...  │  ← enunciado
│                             │
│  ┌──────────────────────┐  │
│  │ A  primeira opção    │  │  ← option button
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ B  segunda opção     │  │  ← selected = destaque primário
│  └──────────────────────┘  │
│  ...C, D, E...              │
│                             │
│  ┌────┐  ┌────────┐  ┌────┐ │
│  │❓  │  │🎓      │  │⚠️  │ │  ← confidence buttons
│  │Não sei│Estudando│Devia│  │
│  └────┘  └────────┘  └────┘ │
│                             │
│  [← Ant] [🚩 Reportar] [⏭ Pular] │
└─────────────────────────────┘
```

## ImmersiveBar

| Elemento  | Sempre | Só com timer |
|-----------|--------|--------------|
| Botão sair (✕) | ✓ | ✓ |
| "questão N/Total" | ✓ | ✓ |
| Botão mapa (🗺)  | ✓ | ✓ |
| Countdown timer  | — | ✓ |

## Botões de confiança (confidence)

| Botão        | Ícone           | Ação                      |
|--------------|-----------------|---------------------------|
| Não sei      | `help_outline`  | confidence: 'unsure'      |
| Estudando    | `school`        | confidence: 'studying'    |
| Devia saber  | `warning`       | confidence: 'should_know' |

- Habilitados apenas com uma opção selecionada
- Desabilitados se questão já foi respondida (`currentAnswered = true`)
- Clicar em qualquer um avança para próxima questão
- Na última questão: abre FinishModal antes de finalizar

## Navegação secundária

| Botão     | Habilitação              | Ação                         |
|-----------|--------------------------|------------------------------|
| Anterior  | desabilitado na Q1       | volta para questão anterior  |
| Reportar  | sempre                   | abre ReportIssueModal        |
| Pular     | sempre                   | marca como skipped, avança   |

## Modais durante o simulado

| Modal            | Trigger                | Ação principal                   |
|------------------|------------------------|----------------------------------|
| ExitModal        | botão sair (✕)         | "Sair" → state: idle             |
| QuestionMapModal | botão mapa (🗺)        | clique em questão → navega       |
| ReportIssueModal | botão Reportar         | texto livre → flag na questão    |
| FinishModal      | última questão + conf. | "Confirmar" → state: finished    |
| LoadingModal     | `loadingFinish: true`  | spinner bloqueante "Calculando…" |

## QuestionMapModal — grid de questões

```
┌──────────────────────┐
│   Mapa de Questões   │
│  1  2  3  4  5  6   │
│  ●  ●  ◉  ○  ○  ○   │
│  ●= respondida       │
│  ◉= atual           │
│  ○= não visitada    │
│  ×= pulada          │
└──────────────────────┘
```
