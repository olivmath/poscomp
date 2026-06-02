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
│  [✕]              3 / 12   │  ← top bar
├─────────────────────────────┤
│ ████████░░░░░░░░░░░░░░░░░   │  ← progress strip
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │  Enunciado da       │   │  ← frente do card (flip)
│  │  questão vai aqui   │   │
│  │                     │   │
│  │  👆 Toque p/ resposta│   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  ┌──────────┐ ┌──────────┐ │
│  │ [✕] Errei│ │Acertei[✓]│ │  ← sempre visíveis
│  └──────────┘ └──────────┘ │
│                             │
│  ⏰ Próxima revisão: amanhã  │  ← feedback temporário (500ms)
│                             │
├─────────────────────────────┤
│  Home  Revisão  Hist  Perfil│
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
│         ✅ check_circle      │
│    Sessão concluída!         │
│    12 cards revisados        │
│                             │
│  ● Devia saber        5     │
│  ● Estudando          4     │
│  ● Não sei            3     │
│                             │
│  [Fazer Simulado]           │
└─────────────────────────────┘
```

## Layout — state: empty

```
┌─────────────────────────────┐
│       🎉 celebration        │
│    Tudo em dia!              │
│  Nenhuma questão para revisar│
│  hoje. Volte amanhã ou...   │
│                             │
│  [Fazer Simulado]           │
└─────────────────────────────┘
```

## Layout — paywall

```
┌─────────────────────────────┐
│         🔒 lock             │
│    Recurso Premium           │
│  A revisão espaçada é        │
│  exclusiva para assinantes. │
│                             │
│  [Ver planos]               │
└─────────────────────────────┘
```
