# Admin — Tela: Reports (Questões Reportadas)

## Layout

```
┌──────────────────────────────────────────────────────┐
│ [filtro: pendente / resolvido]                       │
├──────────────────────────────────────────────────────┤
│ Q#  | Comentário do usuário        | Data   | Ações  │
│ 42  | "Gabarito parece errado..."  | 02/06  | [...]  │
│ 17  | "Enunciado ambíguo"          | 01/06  | [...]  │
└──────────────────────────────────────────────────────┘
```

## Ações por report (`[...]`)

| Ação              | Function backend          | Confirmação? |
|-------------------|---------------------------|--------------|
| Marcar resolvido  | `resolveFlaggedQuestion`  | Não          |
| Deletar report    | `deleteFlaggedQuestion`   | Sim          |
| Ver questão       | abre modal com a questão completa (leitura local) | — |

## Expansão do report

Clicar na linha expande e mostra:
- UID do usuário que reportou (não exibir email — apenas uid)
- `resultId` vinculado (se existir) — link para ver qual simulado gerou o report
- Botão "Ver questão" abre o formulário de edição da questão (`updateQuestion`)

## Badge no menu lateral

- Número de reports com `resolved = false`
- Some quando `count = 0`

## Nota de segurança (tech-debt)

`getFlaggedQuestions` e `resolveFlaggedQuestion` atualmente não verificam admin — qualquer usuário autenticado pode chamar. Fix pendente em `backend/tech-debt.md` item #1.
