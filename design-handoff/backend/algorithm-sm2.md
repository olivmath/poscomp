# Algoritmo SM-2 — Revisão Espaçada

## O que é

SM-2 (SuperMemo 2) é um algoritmo de repetição espaçada que agenda revisões no momento ideal antes que o conteúdo seja esquecido. Quanto mais você acerta um card, maior o intervalo antes da próxima revisão.

---

## Implementação no app

O algoritmo é aplicado na function `reviewCard` → `applySm2(card, studied)`.

```typescript
function applySm2(card: SrsCard, studied: boolean): ReviewCardOutput {
  let { interval, easeFactor, repetitions } = card

  if (studied) {
    // Acertou: aumenta intervalo e facilidade
    interval    = Math.round(interval * easeFactor)
    easeFactor  = easeFactor + 0.1
    repetitions = repetitions + 1
  } else {
    // Errou: reseta intervalo, diminui facilidade
    interval    = 1
    easeFactor  = Math.max(1.3, easeFactor - 0.2)
    repetitions = 0
  }

  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + interval)
  // ...
}
```

---

## Parâmetros e valores iniciais

| Parâmetro    | Valor inicial | Descrição                                    |
|--------------|---------------|----------------------------------------------|
| `easeFactor` | 2.5           | multiplicador do intervalo (mín: 1.3)        |
| `interval`   | 1             | dias até a próxima revisão                   |
| `repetitions`| 0             | nº de revisões bem-sucedidas consecutivas    |

---

## Progressão por acertos consecutivos

| Revisão | Studied | interval              | easeFactor | Próxima revisão |
|---------|---------|-----------------------|------------|-----------------|
| Inicial | —       | 1                     | 2.5        | 1 dia           |
| 1ª      | ✓       | round(1 × 2.5) = 3   | 2.6        | 3 dias          |
| 2ª      | ✓       | round(3 × 2.6) = 8   | 2.7        | 8 dias          |
| 3ª      | ✓       | round(8 × 2.7) = 22  | 2.8        | 22 dias         |
| 4ª      | ✓       | round(22 × 2.8) = 62 | 2.9        | 62 dias         |

---

## Comportamento em caso de erro

Ao errar (`studied = false`):
- `interval` volta a 1 (revisão amanhã)
- `easeFactor` cai 0.2 (mínimo: 1.3)
- `repetitions` zera

Isso faz o card voltar ao início da progressão, mas com `easeFactor` menor — intervalos futuros crescem mais devagar.

---

## Integração com o simulado

Quando `finishSimulado` é chamado:
- Cria ou atualiza `srs_cards/{questionId}` com `dueDate = now`
- Isso **força** o card a aparecer na fila de revisão imediatamente
- Mas não aplica SM-2 — SM-2 só é aplicado quando o usuário revisa via `reviewCard`

**Intenção**: o simulado "coloca o card na fila", a revisão "agenda o próximo encontro".

---

## Priorização na fila de revisão

`getPendingCards` não usa SM-2 — apenas ordena por prioridade mapeada da última confiança declarada no simulado:

| `lastConfidence` | Prioridade | Ordem |
|------------------|-----------|-------|
| `should_know`    | P1        | 1ª   |
| `studying`       | P2        | 2ª   |
| `unsure`         | P3        | 3ª   |

Empates dentro da mesma prioridade: ordenado por `dueDate` mais antiga primeiro.

---

## Desvios do SM-2 clássico

| SM-2 original             | Esta implementação                      |
|---------------------------|-----------------------------------------|
| Usa Q (0-5) por qualidade | Usa boolean `studied` (acertou/errou)   |
| Cálculo: `EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))` | Simplificado: ±0.1/±0.2 |
| Intervalo mínimo: 1 dia   | Idem                                    |
| EF mínimo: 1.3            | Idem                                    |
| Primeira repetição = 1 dia, segunda = 6 dias | Usa `interval * easeFactor` desde a 1ª |
