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
    │        └── "Fazer Simulado" ──► / (abre config)
    │
   ├── [state: finished] ──► "Sessão concluída!"
    │        ├── mostra contagem P1/P2
    │        └── "Fazer Simulado" ──► / (abre config)
    │
   └── [state: running] ──► flashcard
              │
             ├── [frente] enunciado da questão
              │      Toque ──► flip para verso
              │
             ├── [verso] resposta em markdown
              │      Toque ──► flip para frente
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
│ ████████░░░░░░░░░░░░░░░░░   │ ← progress strip
├─────────────────────────────┤
│                             │
│ [FRENTE]  enunciado        │
│                             │
│  Toque para ver resposta │
├─────────────────────────────┤
│ [Errei] [X]  [Acertei]    │ ← sempre visível, independe do flip
├─────────────────────────────┤
│  Próxima revisão: em 3 dias │ ← aparece por 500ms após classificar
└─────────────────────────────┘
```

## Prioridades SM-2

| Confiança no simulado | Prioridade |
|-----------------------|----------- |
| Devia saber           | P1         |
| Estudando             | P2         |
| Não sei               | P3         |

* Os cards da P1, P2 Sempre vão ser priorizados tanto para revisao atual quando para revisar mais tarde. a P3 não deve ser colocada na fila de revisõa espaçada;
* Quando motar a revisao, mostre P1, depois P2, e nao precisa adicionar as P3.

## Visualização por Matéria

Tela acessível a partir de `/revisao` — mostra o histórico de simulados e a próxima revisão agrupados por matéria.

```
┌─────────────────────────────────────────┐
│ Revisões por matéria                   │
├─────────────────────────────────────────┤
│ Matemática                             │
│ ● [02/06]  [03/06]  → (10/06)          │
│                                         │
│ Computação                             │
│ ● [02/06]  → (07/06)                   │
│                                         │
│ Algoritmos                             │
│ ● [30/05]  → (04/06)                   │
└─────────────────────────────────────────┘
```

### Legenda
- `[DD/MM]` — datas em que a matéria foi revisada (cada bolinha = uma sessão)
- `→ (DD/MM)` — próxima revisão agendada pelo SM-2
- Matérias sem revisão pendente não aparecem nessa lista
- Ordenação: matérias com revisão mais próxima primeiro (urgência)



