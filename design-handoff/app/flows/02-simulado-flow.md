# Fluxo 2 — Simulado

Cada fase do simulado tem rota dedicada. O botão "voltar" do browser funciona naturalmente entre fases.

```
[/]  (Home — idle)
        │
       ├── "Começar Simulado" ──► navigate('/simulado/running', { config: padrão })
        │
       └── "Simulado Customizado" ──► navigate('/simulado/config')

[/simulado/config]
        │
       ├── "Voltar" ──► navigate('/')
        └── "Começar Simulado" ──► navigate('/simulado/running', { config })

[/simulado/running]
        │
       ├── Selecionar opção (A/B/C/D/E)
        │
       ├── Classificar confiança:
        │    ├── "Não sei"       (confidence: unsure)
        │    ├── "Estudando"     (confidence: studying)
        │    └── "Devia saber"   (confidence: should_know)
        │
       ├── "Pular" ──► próxima questão (sem classificar)
        │
       ├── "Anterior" ──► questão anterior (pode modificar a resposta)
        │
       ├── "Reportar" ──► ReportIssueModal ──► flag na questão + comentário opcional
        │
       ├── "Finalizar" (respondeu todas?)
        │    ├── Não ──► Botão bloqueado
        │    └── Sim ──► FinishModal com mapa
        │                  ├── "Confirmar" ──► navigate('/simulado/resultado', { result })
        │                  ├── "Cancelar" ──► continua na questão
        │                  └── "Questão N" ──► volta diretamente para aquela questão
        │
       ├── [ícone mapa] ──► QuestionMapModal ──► navegar por número
        │
       └── [ícone sair] ──► ExitModal
                              ├── "Sair" ──► navigate('/') (descarta progresso)
                              └── "Cancelar" ──► continua

[/simulado/resultado]
        │
       └── RelatorioFinal
              ├── "Novo Simulado" ──► navigate('/')
              └── "Revisar"       ──► navigate('/revisao')
```

## Configurações do simulado

| Parâmetro       | Opções                                                     | Padrão     |
|-----------------|-------------------------------------------------------------|------------|
| Áreas/Temas     | Todas · Matemática · Fund. Computação · Tec. Computação    | Todas      |
| Nº de questões  | 5 · 10 · 20 · Máximo                                       | 5         |
| Tempo/questão   | Sem limite · 1 min · 2 min                                  | Sem limite |

Seleção de áreas: chips toggle. "Todas" ou Múltiplas áreas.

## Indicadores durante o simulado

- **Barra de progresso**
- **Timer** — conta regressiva por questão (só se timerMode = 'per-question')
- **QuestionMap** — modal com grade de todas as questões por status:
  - `unvisited` — não visitada
  - `answered` — respondida com alternativa a mostra (a, b, c, d, e)
  - `skipped` — pulada
