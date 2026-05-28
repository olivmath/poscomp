# Simulado — Fluxo completo

Fonte de questões **novas**. Ao terminar, gera `SrsCard` para erros e respostas `unsure`.

---

## Fluxo de estados

```
idle ──[Configurar]──▶ config ──[Começar Simulado]──▶ running ──[última questão]──▶ finished
  ↑                      │                                                              │
  └──────────────────────┘ [Voltar]                              [Refazer] ────────────┘
```

---

## Estado: idle

Tela de entrada do simulado.

```
┌─────────────────────────────────────────┐
│                                         │
│         Simulado POSCOMP                │
│                                         │
│  [Focado ou Geral] [Personalizável]     │
│  [Múltipla escolha A–E]                 │
│                                         │
│  Último: 8 acertos · 4min 32s           │  ← só aparece se houver histórico
│                                         │
│  [ Configurar ]   [ Começar ]           │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝       📅       👤
```

---

## Estado: config

Configuração antes de começar.

```
┌─────────────────────────────────────────┐
│                                         │
│         Configurar Simulado             │
│                                         │
│  Temas                                  │
│  ┌──────────────────────────────────┐   │
│  │[Todas✓][Algoritmos][Matemática]  │   │
│  │[Lógica][Banco de Dados][Redes]   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  Nº de questões                         │
│  ┌──────────────────────────────────┐   │
│  │ [ 5 ] [ 10✓] [ 20 ] [Máximo]    │   │
│  └──────────────────────────────────┘   │
│                                         │
│  Tempo por questão                      │
│  ┌──────────────────────────────────┐   │
│  │ [Sem limite✓] [1 min] [2 min]    │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [ Voltar ]     [ Começar Simulado ]    │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝       📅       👤
```

---

## Estado: running (modo imersivo)

BottomNav oculto. ImmersiveBar no topo.

```
┌─────────────────────────────────────────┐
│ [✕ Sair]    Q.3/12    ⏱ 01:45   [Mapa] │  ← ImmersiveBar
├─────────────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░░░░░░  30%    │  ← progress bar
├─────────────────────────────────────────┤
│                                         │
│  Dado um vetor de n elementos,          │
│  qual algoritmo de ordenação tem        │
│  complexidade O(n log n) no pior caso?  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  A  Bubble Sort                  │   │
│  │  B  Merge Sort          ← selecionado│
│  │  C  Quick Sort                   │   │
│  │  D  Insertion Sort               │   │
│  │  E  Selection Sort               │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [? Não sei  →]   [✓ Tenho certeza  →]  │  ← confiança (habilitado só com seleção)
│                                         │
│            [⏭ Pular questão]            │
│                                         │
└─────────────────────────────────────────┘
```

### Modal: Sair do simulado

```
┌──────────────────────────────┐
│        ⚠                    │
│   Sair do simulado?          │
│                              │
│  Seu progresso será perdido. │
│                              │
│  [ Continuar ]  [ Sair ]     │
└──────────────────────────────┘
```

### Modal: Mapa de questões

```
┌──────────────────────────────────────┐
│  Mapa de questões              [✕]   │
│                                      │
│   1   2   3   4   5   6   7   8      │
│  [✓] [✓] [→] [ ] [ ] [?] [ ] [ ]    │
│                                      │
│   ○ Não visitada   ⏭ Pulada          │
│   ? Não sei        ✓ Certeza         │
└──────────────────────────────────────┘
```

**Status por questão:**
- `unvisited` — não visitada (cinza)
- `skipped` — pulada (laranja)
- `unsure` — respondeu com "Não sei" (amarelo)
- `certain` — respondeu com "Tenho certeza" (verde)

---

## Estado: finished

Resultado final do simulado.

```
┌─────────────────────────────────────────┐
│                                         │
│          8  / 12                        │  ← score
│          4min 32s                       │  ← tempo
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  Algoritmos      4/5    ✅        │   │
│  │  Matemática      2/4    ⚠️        │   │
│  │  Lógica          2/3    ⚠️        │   │
│  │  Banco de Dados  0/0    —         │   │
│  │  Redes           0/0    —         │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [ Refazer ]     [ Ver Histórico ]      │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝       📅       👤
```

---

## Geração de SrsCards ao terminar

Para cada resposta no resultado:

```
answer.correct = false        → SrsCard criado com simuladoCorrect: false
answer.confidence = 'unsure'  → SrsCard criado com simuladoCorrect: true
                                (acertou mas não tinha certeza)
answer.correct = true
  + confidence = 'certain'   → nenhum card criado (não precisa revisar)
```

Campos do card gerado:
- `studied: false` (default — usuário ainda não classificou)
- `simuladoCorrect: answer.correct`
- `dueDate: hoje` (disponível imediatamente para revisão)
- SM-2 padrão: `easeFactor: 2.5`, `interval: 1`, `repetitions: 0`
