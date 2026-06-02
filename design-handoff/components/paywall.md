# Componente — Paywall Card

Reutilizado em: Revisão, Histórico, HistoricoDetalhe.

## Layout padrão

```
┌─────────────────────────────┐
│           🔒 lock           │
│      Recurso Premium        │
│  [descrição do recurso]     │
│                             │
│     [Ver planos]            │
└─────────────────────────────┘
```

## Textos por página

| Página            | Descrição                                           |
|-------------------|-----------------------------------------------------|
| Revisão           | "A revisão espaçada é exclusiva para assinantes."   |
| Histórico         | "O histórico de simulados + Comentários são exclusivos para assinantes." |
| HistoricoDetalhe  | Idem Histórico — botão "Assinar Agora" (variação)   |

## Botão CTA

- "Ver planos" → navigate('/perfil')
- "Assinar Agora" → navigate('/perfil') (variação em HistoricoDetalhe)
- Classe `btn-full` (largura total)

## Posicionamento

Centralizado vertical e horizontalmente na tela com flex/grid.
Mesma estrutura que os estados empty/finished da Revisão.
