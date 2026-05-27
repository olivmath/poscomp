# Home — Dashboard

Ponto de entrada principal. Agrega frequência, banner de revisão e carrossel de análises.

> **Nota:** A página Análises foi incorporada aqui. A aba Análises foi removida do BottomNav.

---

## Estado: com dados + revisão pendente

```
┌─────────────────────────────────────────┐
│                                         │
│  Olá, Lucas! 👋    ██████████░░░░░░     │  ← frequência
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ANÁLISES                   ◀ ●○○○○ ▶   │
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
│  Olá, Lucas! 👋    ██████████░░░░░░     │  ← frequência
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ANÁLISES                   ◀ ●○○○○ ▶   │
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
│   Forte:      Redes                     │
│   Fraco:      Algoritmos                │
│                                         │
└─────────────────────────────────────────┘
```

### Slide 2 — Desempenho (por área)

```
┌─────────────────────────────────────────┐
│  Por área                               │
│                                         │
│  Lógica       █████████░  88%           │
|  Algoritmos   ████████░░  78%           │
│  Redes        ███████░░░  70%           │
|  Matemática   ██████░░░░  61%           │
│  Banco Dados  ████░░░░░░  43%           │
│                                         │
└─────────────────────────────────────────┘
```

### Slide 3 — Calibração (confiança)

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


### Slide 4 — Analises

```
┌─────────────────────────────────────────┐
│  Precisa revisar                        │
│                                         │
│  Banco Dados  ████░░░░░░  43%           │
│  Matemática   ██████░░░░  61%           │
│                                         │
├─────────────────────────────────────────┤
│  Estudo completo                        │
│  Lógica       █████████░  88%           │
|  Algoritmos   ████████░░  78%           │
│                                         │
└─────────────────────────────────────────┘
```

### Slide 5 — Linha do tempo

```
┌─────────────────────────────────────────┐
│ Progresso
  [ grafico de linha com acurácia por simulado ]

└─────────────────────────────────────────┘
```



---

## Barra de frequência

- Baseada em dias com pelo menos 1 atividade (simulado ou revisão)
- Mostra: `X dias seguidos`
- Cor: verde ≥ 80%, amarelo ≥ 50%, vermelho < 50%
