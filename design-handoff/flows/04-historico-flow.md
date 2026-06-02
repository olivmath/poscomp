# Fluxo 4 — Histórico (Premium)

```
[/historico]
    │
    ├── [Free user] ──► Paywall card ──► "Ver planos" ──► /perfil
    │
    ├── [loading] ──► spinner
    │
    ├── [error] ──► mensagem de erro
    │
    ├── [empty] ──► "Nenhum simulado realizado"
    │       └── "Começar Simulado" ──► /simulado (NOTA: rota /simulado não existe — bug)
    │
    └── [lista de resultados] ──► cards clicáveis
              │
              └── click em card ──► /historico/:id
                        │
                        ├── [loading] ──► spinner
                        ├── [Free user] ──► Paywall
                        ├── [error/not found] ──► erro com "Voltar ao Histórico"
                        └── [sucesso] ──► RelatorioFinal
                                  └── "Voltar" ──► /historico
```

## ResultCard — layout

```
┌─────────────────────────────────────────┐
│  02/06/2026    8/10  +5%   12:34   ›   │
│  📐 Matemática: 90%                     │
└─────────────────────────────────────────┘
```

| Campo         | Fonte de dados                         | Cor condicional             |
|---------------|----------------------------------------|-----------------------------|
| Data          | `completedAt` (Firestore Timestamp)    | —                           |
| Score         | `score / totalQuestions`              | ≥80% verde · ≥60% amarelo · <60% vermelho |
| Trend         | diff % vs resultado anterior          | + verde · - vermelho · = neutro |
| Tempo         | `timeSpentSeconds` formatado           | —                           |
| Melhor área   | área com maior % de acerto            | —                           |
