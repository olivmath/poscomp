# Tela — Revisão Espaçada (`/revisao`)

## Estados da tela

| State     | Visual                                                         |
|-----------|----------------------------------------------------------------|
| loading   | spinner centralizado                                           |
| paywall   | card bloqueado com lock icon + "Ver planos"                    |
| empty     | card "Tudo em dia!" com celebration icon                       |
| running   | flashcard interativo                                           |
| finished  | card de resumo da sessão com contagem por prioridade           |

## Layout — state: running

```
┌─────────────────────────────┐
│ =                     ( )   │ ← esquerda menu sandwich; direita foto perfil leva para /perfil
├─────────────────────────────┤
│ ████████░░░░░░░░░░░░░░░░░   │ ← progress strip
├─────────────────────────────┤
│                             │
│ ┌─────────────────────┐   │
│  │                     │   │
│  │ Enunciado da       │   │ ← frente do card (flip)
│  │ questão vai aqui   │   │
│  │                     │   │
│  │  Toque p/ resposta│   │
│  │                     │   │
│ └─────────────────────┘   │
│                             │
│ ┌──────────┐ ┌──────────┐ │
│  │ [] Errei│ │Acertei[]│ │ ← sempre visíveis
│ └──────────┘ └──────────┘ │
│                             │
│  Próxima revisão: amanhã  │ ← feedback temporário (500ms)
│                             │
└─────────────────────────────┘
```

## Flipcard — lógica

- **Frente**: enunciado da questão + dica "Toque para ver a resposta"
- **Verso**: gabarito (opção correta + texto) ou markdown customizado
- Toque em qualquer lugar do card = flip
- Animação CSS 3D (rotateY)
- Feedback visual ao clicar Acertei/Errei: `feedback-correct` / `feedback-wrong` por 500ms

## Layout — state: finished

```
┌─────────────────────────────┐
│         check_circle      │
│   Sessão concluída!         │
│   12 cards revisados        │
│                             │
│ ● Devia saber        5     │
│ ● Estudando          4     │
│ ● Não sei            3     │
│                             │
│ [Fazer Simulado]           │
└─────────────────────────────┘
```

## Layout — state: empty

```
┌─────────────────────────────┐
│       celebration        │
│   Tudo em dia!              │
│ Nenhuma questão para revisar│
│ hoje. Volte amanhã ou...   │
│                             │
│ [Fazer Simulado]           │
└─────────────────────────────┘
```

## Layout — paywall

```
┌─────────────────────────────┐
│         lock             │
│   Recurso Premium           │
│ A revisão espaçada é        │
│ exclusiva para assinantes. │
│                             │
│ [Ver planos]               │
└─────────────────────────────┘
```

---

## Visualização por Matéria

Acessível via tab ou botão na tela `/revisao` (estado `empty` ou `finished`).

```
┌─────────────────────────────────────────┐
│                                         │
│ Algoritmos                             │ ← matéria
│ ● [30/05]  → (04/06)                   │ ←  mais urgente primeiro
│                                         │
│ Computação                             │
│ ● [02/06]  → (07/06)                   │
│                                         │
│ Matemática                             │
│ ● [02/06]  [03/06]  → (10/06)          │ ← múltiplas sessões
│                                         │
└─────────────────────────────────────────┘
```

### Legenda visual

| Elemento        | Significado                                                    |
|-----------------|----------------------------------------------------------------|
| `[DD/MM]`       | Data de um simulado que cobriu essa matéria                       |
| `→ (DD/MM)`     | Próxima revisão agendada (menor `dueDate` dos cards da matéria)   |
| Ordem das linhas | Urgência crescente — matéria com revisão mais próxima aparece primeiro |

### Fonte dos dados

| Dado                | Origem                                                             |
|---------------------|--------------------------------------------------------------------|
| Datas passadas `[]` | `results/{resultId}.completedAt` filtrado por matéria em `materiaBreakdown` |
| Próxima revisão `→` | `min(srs_cards.dueDate)` dos cards onde `srs_cards.materia == X`      |

> `SrsCard` precisa do campo `materia` (denormalizado) para evitar joins com `questions`. Ver `data-model.md`.
