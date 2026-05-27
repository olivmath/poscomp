# Revisão — Sessão de Flashcard

Consome os `SrsCard` gerados pelos simulados. Questões **já vistas**, ordenadas por prioridade.

---

## Prioridade da fila

| # | Caso | Cor | Raciocínio |
|---|---|---|---|
| P1 | `studied: true` + `simuladoCorrect: false` | 🔴 | Estudou e errou → gap real → urgente |
| P2 | `studied: false` + `simuladoCorrect: true` | 🟡 | Acertou sem estudar → pode ser chute → confirmar |
| P3 | `studied: false` + `simuladoCorrect: false` | 🟠 | Não estudou e errou → não está pronto ainda |
| P4 | `studied: true` + `simuladoCorrect: true` | ⚪ | Estudou e acertou → manutenção, último |

Dentro de cada grupo → SM-2 ordena por `dueDate`.

---

## Fluxo de estados

```
entrada ──▶ flashcard-frente ──[Revelar]──▶ flashcard-verso ──[Não estudei / Estudei]──▶
  ↑                                                                        │
  └────────────────────────── próximo card ───────────────────────────────┘
                                                                           │
                                                              último card  ↓
                                                                     concluída
```

---

## Estado: entrada (sem cards pendentes)

```
┌─────────────────────────────────────────┐
│                                         │
│         🎉 Tudo em dia!                 │
│                                         │
│    Nenhuma questão para revisar         │
│    hoje. Volte amanhã ou faça           │
│    um novo simulado.                    │
│                                         │
│    [ Fazer Simulado ]   [ Início ]      │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝       📅       👤
```

---

## Estado: flashcard — frente

```
┌─────────────────────────────────────────┐
│  ←  Revisão           3/12   ████░░░░   │  ← progresso da sessão
│                                         │
│  🔴 P1  ·  Algoritmos                   │  ← prioridade + área
│                                         │
│                                         │
│                                         │
│  Dado um vetor de n elementos,          │
│  qual algoritmo tem complexidade        │
│  O(n log n) no pior caso?               │
│                                         │
│                                         │
│                                         │
│         [ Revelar gabarito ]            │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝 ⁵     📅       👤
```

---

## Estado: flashcard — verso (após revelar)

```
┌─────────────────────────────────────────┐
│  ←  Revisão           3/12   ████░░░░   │
│                                         │
│  🔴 P1  ·  Algoritmos                   │
│                                         │
│  Dado um vetor de n elementos,          │
│  qual algoritmo tem complexidade        │
│  O(n log n) no pior caso?               │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  ✅ Gabarito: (B) Merge Sort     │   │
│  │  ✗  Você respondeu: (C) Quick    │   │
│  └──────────────────────────────────┘   │
│                                         │
│   [ Não estudei ]      [ Estudei ]      │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝 ⁵     📅       👤
```

### Comportamento dos botões

| Botão | `studied` | SM-2 | Próxima aparição |
|---|---|---|---|
| **Estudei** | `true` | avança intervalo normalmente | agendado pelo SM-2 |
| **Não estudei** | `false` | não roda | fim da fila (P2/P3) |

---

## Estado: card P2 (não estudei + acertou)

Acertou no simulado sem ter estudado — pode ser chute.

```
┌─────────────────────────────────────────┐
│  ←  Revisão           7/12   ████████   │
│                                         │
│  🟡 P2  ·  Redes                        │
│                                         │
│  Qual protocolo da camada de            │
│  transporte garante entrega             │
│  confiável?                             │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  ✅ Gabarito: (A) TCP            │   │
│  │  ✅ Você respondeu: (A) TCP      │   │  ← acertou
│  └──────────────────────────────────┘   │
│                                         │
│   [ Não estudei ]      [ Estudei ]      │
│                                         │
└─────────────────────────────────────────┘
```

---

## Estado: sessão concluída

```
┌─────────────────────────────────────────┐
│                                         │
│          🎉 Sessão concluída!           │
│                                         │
│   12 cards revisados                    │
│                                         │
│   🔴  5  ×  Estudei + errei             │
│   🟡  2  ×  Não estudei + acertei       │
│   🟠  3  ×  Não estudei + errei         │
│   ⚪  2  ×  Estudei + acertei           │
│                                         │
│   Próxima revisão: amanhã (8 cards)     │
│                                         │
│   [ Fazer Simulado ]   [ Início ]       │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝       📅       👤
```

---

## Indicador de prioridade no card

| Prioridade | Label | Cor |
|---|---|---|
| P1 | `🔴 P1` | vermelho |
| P2 | `🟡 P2` | amarelo |
| P3 | `🟠 P3` | laranja |
| P4 | `⚪ P4` | neutro |

---

## Barra de progresso da sessão

- `{atual} / {total}` cards da sessão atual
- Barra visual preenchendo da esquerda para direita
- Total = todos os cards com `dueDate <= hoje` no momento de abertura da sessão
