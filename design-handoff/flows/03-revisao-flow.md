# Fluxo 3 — Revisão Espaçada (Premium)

Algoritmo SM-2: prioriza cards com base na confiança declarada durante o simulado.
Fila de revisão: P1 (devia saber) → P2 (estudando) → P3 (não sei).

```
[/revisao]
    │
    ├── [Free user] ──► Paywall card ──► "Ver planos" ──► /perfil
    │
    ├── [state: loading] ──► spinner
    │
    ├── [state: empty] ──► "Tudo em dia!"
    │         └── "Fazer Simulado" ──► / (abre config)
    │
    ├── [state: finished] ──► "Sessão concluída!"
    │         ├── mostra contagem P1/P2/P3
    │         └── "Fazer Simulado" ──► / (abre config)
    │
    └── [state: running] ──► flashcard
              │
              ├── [frente] enunciado da questão
              │       Toque ──► flip para verso
              │
              ├── [verso] resposta/gabarito
              │       Toque ──► flip para frente
              │
              ├── "Errei" ──► SM-2 recalcula (intervalo curto) ──► próximo card
              │
              └── "Acertei" ──► SM-2 recalcula (intervalo longo) ──► próximo card
                        │
                        └── [último card] ──► state: finished
```

## Estrutura do flashcard

```
┌─────────────────────────────┐
│  [X]              1 / 12    │  ← top bar: fechar + progresso
├─────────────────────────────┤
│ ████████░░░░░░░░░░░░░░░░    │  ← barra de progresso
├─────────────────────────────┤
│                             │
│  [FRENTE]  enunciado        │
│                             │
│  👆 Toque para ver resposta  │
├─────────────────────────────┤
│  [Errei] [X]  [Acertei] ✓  │  ← sempre visível, independe do flip
├─────────────────────────────┤
│  ⏰ Próxima revisão: em 3 dias │  ← aparece por 500ms após classificar
└─────────────────────────────┘
```

## Prioridades SM-2

| Confiança no simulado | Prioridade | Cor         |
|-----------------------|-----------|-------------|
| Devia saber           | P1        | Vermelho    |
| Estudando             | P2        | Amarelo     |
| Não sei               | P3        | Cinza       |
