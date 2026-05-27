# Home — Dashboard

Ponto de entrada principal. Agrega frequência, banner de revisão e carrossel de análises.

> **Nota:** A página Análises foi incorporada aqui. A aba Análises foi removida do BottomNav.

---

## Estado: com dados + revisão pendente

```
┌─────────────────────────────────────────┐
│                                         │
│  Olá, Lucas! 👋                         │
│  ████████░░  80%  · 7 dias seguidos     │  ← frequência
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🧠  5 questões para revisar     │    │  ← banner SRS
│  │           Revisar agora  →      │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ANÁLISES                   ◀ ●○○○○ ▶  │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   [Slide 1 — Geral]             │    │
│  │   score geral + timeline        │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝 ⁵     📅      👤
```

---

## Estado: sem revisão pendente (banner oculto)

```
┌─────────────────────────────────────────┐
│                                         │
│  Olá, Lucas! 👋                         │
│  ████████░░  80%  · 7 dias seguidos     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ANÁLISES                   ◀ ●○○○○ ▶  │
│  ┌─────────────────────────────────┐    │
│  │   [carrossel de análises]       │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝       📅      👤
```

---

## Carrossel de Análises — Slides

Mesmo carrossel da antiga página Análises. 5 slides com scroll horizontal e dots de navegação.

### Slide 1 — Geral

```
┌─────────────────────────────────────────┐
│  Geral                                  │
│                                         │
│   72%  acertos  ·  43 questões          │
│   ─────────────────────────────         │
│   [timeline de barras dos últimos       │
│    simulados com data e score]          │
│                                         │
│   27/04  03/05  10/05  20/05  27/05     │
│     ▓▓     ▓▓▓    ▓▓▓▓   ▓▓▓▓▓  ▓▓▓▓▓ │
│     55%    60%    65%    70%    72%     │
└─────────────────────────────────────────┘
```

### Slide 2 — Calibração (confiança)

```
┌─────────────────────────────────────────┐
│  Calibração                             │
│                                         │
│  Tenho certeza e acertei   ████████ 80% │
│  Tenho certeza e errei     ██░░░░░░ 20% │
│  Não sei e acertei         ████░░░░ 40% │
│  Não sei e errei           ██████░░ 60% │
│                                         │
└─────────────────────────────────────────┘
```

### Slide 3 — Heatmap (por área)

```
┌─────────────────────────────────────────┐
│  Por área                               │
│                                         │
│  ⚙ Algoritmos   ████████░░  78%        │
│  ∑ Matemática   ██████░░░░  61%        │
│  🧠 Lógica      █████████░  88%        │
│  🗃 Banco Dados  ████░░░░░░  43%        │
│  🌐 Redes        ███████░░░  70%        │
│                                         │
└─────────────────────────────────────────┘
```

### Slide 4 — Revisar (áreas com mais erros)

```
┌─────────────────────────────────────────┐
│  Precisa revisar                        │
│                                         │
│  🗃 Banco Dados  ████░░░░░░  43%        │
│  ∑ Matemática   ██████░░░░  61%        │
│  🌐 Redes        ███████░░░  70%        │
│                                         │
└─────────────────────────────────────────┘
```

### Slide 5 — Relaxar (áreas dominadas)

```
┌─────────────────────────────────────────┐
│  Pode relaxar ✅                         │
│                                         │
│  🧠 Lógica      █████████░  88%        │
│  ⚙ Algoritmos   ████████░░  78%        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Barra de frequência

- Baseada em dias com pelo menos 1 atividade (simulado ou revisão)
- Mostra: `% da semana` + `X dias seguidos`
- Cor: verde ≥ 80%, amarelo ≥ 50%, vermelho < 50%

## Banner de revisão

- Visível somente quando `totalPending > 0`
- Clique → navega para `/revisao`
- Texto: `"{N} questões para revisar"`
