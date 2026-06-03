# Tela — Home / Dashboard (`/` — state: idle)

## Layout

```
┌─────────────────────────────┐
│ =                     ( )   │ ← esquerda menu sandwich; direita foto perfil leva para /perfil
|─────────────────────────────|
│                             │
│ [AnnouncementBanner]       │ ← carrocel, condicional, adicionar via admin; suporte a markdown view
│                             │
│ ┌─────────────────────────┐ │
│ │ Frequência semanal     │ │
│ │  5 dias seguidos      │ │
│ │ Dom Seg Ter Qua Qui Sex Sáb │
│ │ ( ) (●) (●) (●) (●) (●) (T)│
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Geral                  │ │
│ │ [LineChart T1→T5]      │ │
│ │                         │ │
│ │ Individual             │ │
│ │ Matemática    ████ 72% │ │
│ │ Fundamentos   ██░░ 48% │ │
│ │ Tecnologia    ███░ 61% │ │
│ └─────────────────────────┘ │
│                             │
│ ┌───────────────────────┐  │
│  │ Simulado customizado │  │ ← outlined button
│ └───────────────────────┘  │
│ ┌───────────────────────┐  │
│  │  Começar Simulado    │  │ ← filled button (primário)
│ └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

## Componentes

| Componente         | Condicional          | Descrição                              |
|--------------------|----------------------|----------------------------------------|
| AnnouncementBanner | só se há anúncios    | banner dismissível no topo             |
| WeekHeader         | sempre               | grade de 7 dias + streak               |
| AnalysisCarousel   | sempre               | gráfico geral + barras por matéria        |
| footer com CTAs    | sempre               | 2 botões de ação                       |

## Estados do AnalysisCarousel

| Estado              | Visual                                               |
|---------------------|------------------------------------------------------|
| loading             | ícone `hourglass_empty` + "Carregando…"             |
| sem dados           | ícone `bar_chart` + "Faça seu primeiro simulado..." |
| com dados + <2 sims | "Realize mais simulados para ver o progresso."      |
| com dados + ≥2 sims | LineChart + barras de matéria                          |

## WeekHeader — lógica visual

- Últimos 7 dias (hoje = dia 7)
- Círculo preenchido = dia com atividade (`activeDays` do Firestore)
- Dia de hoje tem borda/destaque diferente
- Streak: dias consecutivos com atividade até hoje
