# Tela — Simulado em Andamento (state: running)

Modo imersivo: BottomNav some. Tela toda de conteúdo.

## Layout

```
┌─────────────────────────────┐
│ [ Sair]              1:43   │ ← sair, timer (só se timerMode = per-question)
├─────────────────────────────┤
│ ██████░░░░░░░░░░░░░░  3/10  │ ← progress bar (3/10 = 30%)
├─────────────────────────────┤
│                             │
│ Qual é a complexidade do   │
│ algoritmo de ordenação...  │ ← enunciado
│                             │
│ ┌──────────────────────┐  │
│  │ A  primeira opção    │  │ ← option button
│ └──────────────────────┘  │
│ ┌──────────────────────┐  │
│  │ B  segunda opção     │  │ ← selected = destaque primário
│ └──────────────────────┘  │
│ ...C, D, E...              │
│                             │
│ ┌────────┐  ┌────────┐  ┌─────┐ │
│  │Não sei│  │Estudando│ │Devia│ │  ← confidence buttons
│ └────────┘  └────────┘  └────┘ │
│                             │
│ [← Ant] [ Reportar] [ Pular] │
│                             │
├─────────────────────────────┤
└────────────⬆────────────────┘  ← Puxa de baixo pra cima revela o mapa
```

## ImmersiveBar

| Elemento  | Sempre | Só com timer |
|-----------|--------|--------------|
| Botão sair () |  |  |
| "questão N/Total" |  |  |
| Botão mapa ()  |  |  |
| Countdown timer  | — |  |

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
| ExitModal        | botão sair ()         | "Sair" → state: idle             |
| QuestionMapModal | botão mapa ()        | clique em questão → navega       |
| ReportIssueModal | botão Reportar         | texto livre → flag na questão    |
| FinishModal      | última questão + conf. | "Confirmar" → state: finished    |
| LoadingModal     | `loadingFinish: true`  | spinner bloqueante "Calculando…" |

## QuestionMapModal — grid de questões

```
┌──────────────────────┐
│  Mapa de Questões   │
│ 1  2  3  4  5  6   │
│ ●  ●  ◉  ○  ○  ○   │
│ ●= respondida (deve ter a letra + cor da resposta)      │
│ ◉= atual           │
│ ○= não respondida    │
└──────────────────────┘
```

* cada letra tem uma cor difente, nas respostas e no mapa
