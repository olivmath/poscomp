# Admin — Tela: Questões

## Layout — lista

```
┌──────────────────────────────────────────────────────┐
│ [filtro: matéria]  [filtro: ano]     [+ Nova questão]│
├──────────────────────────────────────────────────────┤
│ ID  | Ano  | Matéria           | Enunciado (trunc.)  │
│ 42  | 2023 | Matemática        | "Seja f(x)..."  [..]│
│ 43  | 2022 | Fund. Computação  | "Um algoritmo..."[..]│
└──────────────────────────────────────────────────────┘
```

## Formulário — criar / editar

```
┌──────────────────────────────────────────────────────┐
│ Ano:      [____]                                     │
│ Matéria:  [Matemática | Fund. Computação | Tec. Comp]│
│ Enunciado: [textarea — texto simples]                │
│                                                      │
│ Alternativas:                                        │
│ A: [____]   B: [____]   C: [____]                   │
│ D: [____]   E: [____]                               │
│ Gabarito: ( ) A  ( ) B  ( ) C  ( ) D  ( ) E         │
│                                                      │
│ Comentário (Premium — markdown):                    │
│ ┌────────────────────┐  ┌────────────────────┐      │
│ │ [textarea]         │  │ [preview markdown] │      │
│ └────────────────────┘  └────────────────────┘      │
│                                                      │
│ Card flashcard (opcional):                           │
│   Pergunta: [textarea — texto simples]               │
│   Resposta (markdown):                               │
│   ┌────────────────────┐  ┌────────────────────┐    │
│   │ [textarea]         │  │ [preview markdown] │    │
│   └────────────────────┘  └────────────────────┘    │
│                                                      │
│ [Cancelar]                          [Salvar]         │
└──────────────────────────────────────────────────────┘
```

Campos com preview lado a lado (editor | render). O preview usa o mesmo engine de markdown do app.

## Ações por linha (`[..]`)

| Ação    | Function backend  | Confirmação? |
|---------|-------------------|--------------|
| Editar  | `updateQuestion`  | Não          |
| Deletar | `deleteQuestion`  | Sim — irreversível (cards SRS órfãos ficam no Firestore) |

## Validações obrigatórias

- Ano: inteiro positivo
- Matéria: um dos 3 valores válidos
- Enunciado: não vazio
- Alternativas A–E: todas preenchidas
- Gabarito: exatamente uma opção selecionada
