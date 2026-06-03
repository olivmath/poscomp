# Componentes — Modais

Todos os modais usam `ModalOverlay` como wrapper (backdrop escuro + centralização).

---

## ModalOverlay

- Backdrop semitransparente sobre tudo
- Clique no backdrop = fechar (se `onBackdropClick` fornecido)
- Role: dialog na div interna
- Animação: fade-in

---

## ExitModal (Simulado)

**Trigger**: botão sair () na ImmersiveBar

```
┌──────────────────┐
│ Sair do simulado│
│ O progresso será│
│ perdido.        │
│ [Cancelar] [Sair│
└──────────────────┘
```

---

## FinishModal (Simulado)

**Trigger**: confidence button na última questão

```
┌──────────────────┐
│ Finalizar       │
│ simulado?       │
│ [Cancelar][OK]  │
└──────────────────┘
```

---

## QuestionMapModal (Simulado)

**Trigger**: botão mapa na ImmersiveBar

Grid com todas as questões. Cada célula = uma questão com cor por status:
- `unvisited` → neutro
- `answered` → primário (preenchido)
- `skipped` → outline/muted

Clique em uma célula navega para aquela questão e fecha o modal.

---

## ReportIssueModal (Simulado)

**Trigger**: botão Reportar na navegação secundária

Textarea livre para o usuário descrever o problema na questão.
- "Confirmar" → salva o comentário e fecha
- "Cancelar" → descarta e fecha
- Se já há um comentário, exibe ele preenchido (editável)

---

## LoadingModal

**Trigger**: `loadingFinish = true` (processamento do resultado)

Bloqueante — sem opção de fechar. Spinner + label "Calculando resultado…"

---

## LegalModal (Perfil)

Dois tipos: `privacy` | `terms`

Exibe texto longo (markdown/HTML) em modal scrollável.
Botão fechar no topo.

---

## ConfirmDeleteModal (Perfil)

Confirmação destrutiva para apagar todos os dados.
- Botão cancelar: text button
- Botão confirmar: filled button vermelho
- Durante deleção: tudo desabilitado
