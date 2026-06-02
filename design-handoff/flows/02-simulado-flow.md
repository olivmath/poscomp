# Fluxo 2 — Simulado

A tela `/` (Home) implementa uma máquina de estados inline. O mesmo componente renderiza telas diferentes dependendo do `state`.

```
[Home - state: idle]
        │
        ├── "Começar Simulado" ──► start(config padrão) ──► state: running
        │
        └── "Simulado customizado" ──► state: config
                    │
                    ├── "Voltar" ──► state: idle
                    └── "Começar Simulado" ──► start(config) ──► state: running

[state: running]
        │
        ├── Selecionar opção (A/B/C/D/E)
        │
        ├── Classificar confiança:
        │     ├── "Não sei"       (confidence: unsure)
        │     ├── "Estudando"     (confidence: studying)
        │     └── "Devia saber"   (confidence: should_know)
        │           │
        │           └── [última questão?]
        │                 ├── Não ──► next question
        │                 └── Sim ──► FinishModal
        │                               ├── "Confirmar" ──► state: finished
        │                               └── "Cancelar" ──► continua na questão
        │
        ├── "Pular" ──► próxima questão (sem classificar)
        │
        ├── "Anterior" ──► questão anterior (read-only se já respondida)
        │
        ├── "Reportar" ──► ReportIssueModal ──► flag na questão
        │
        ├── [ícone mapa] ──► QuestionMapModal ──► navegar por número
        │
        └── [ícone sair] ──► ExitModal
                              ├── "Sair" ──► state: idle (descarta progresso)
                              └── "Cancelar" ──► continua

[state: finished]
        │
        └── RelatorioFinal
              ├── "Novo Simulado" ──► state: idle
              └── "Revisar"       ──► navigate('/revisao')
```

## Configurações do simulado

| Parâmetro       | Opções                                                     | Padrão     |
|-----------------|-------------------------------------------------------------|------------|
| Áreas/Temas     | Todas · Matemática · Fund. Computação · Tec. Computação    | Todas      |
| Nº de questões  | 5 · 10 · 20 · Máximo                                       | 10         |
| Tempo/questão   | Sem limite · 1 min · 2 min                                  | Sem limite |

Seleção de áreas: chips toggle. "Todas" = array vazio. Múltiplas áreas = union de questões.

## Indicadores durante o simulado

- **Barra de progresso** — topo da tela, questão atual / total
- **ImmersiveBar** — topo: número da questão, timer (se ativo), botões sair/mapa
- **Timer** — conta regressiva por questão (só se timerMode = 'per-question')
- **QuestionMap** — modal com grade de todas as questões por status:
  - `unvisited` — não visitada
  - `answered` — respondida com confiança
  - `skipped` — pulada
