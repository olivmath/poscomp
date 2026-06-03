# Tela — Configurar Simulado (state: config)

Renderizado na rota `/`, substitui o dashboard. Sem BottomNav visível (não imersivo, mas componente cobre a tela).

## Layout

```
┌─────────────────────────────┐
│                             │
│ ┌─────────────────────┐   │
│  │ Configurar Simulado │   │
│  │                     │   │
│  │ ① Temas            │   │
│  │ [Todas][Mat][Fund][Tec] │
│  │                     │   │
│  │ ② Nº de questões   │   │
│  │ [ 5 ][ 10 ][ 20 ][Máx] │
│  │                     │   │
│  │ ③ Tempo/questão    │   │
│  │ [S/limite][1min][2min]  │
│  │                     │   │
│  │ [Voltar] [Começar] │   │
│ └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

## Componentes de seleção

### Chips de área (Step 1)
- Toggle individual
- "Todas" = desseleciona tudo (array vazio = busca sem filtro)
- Múltiplas áreas podem ser selecionadas simultaneamente
- Visual: chip com ícone Material Symbol + label curto

### Segmented buttons (Steps 2 e 3)
- Seleção única (radio-like)
- Visual: grupo de botões com bordas conectadas, selecionado = fundo primário

## Ações

| Botão             | Comportamento                        |
|-------------------|--------------------------------------|
| Voltar            | volta para state: idle (dashboard)   |
| Começar Simulado  | dispara `start(config)` → running    |
| Ambos             | desabilitados enquanto `loading`     |
