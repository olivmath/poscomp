# Navegação — BottomNav

## Abas

```
┌─────────────────────────────────────────────────────────┐
│  🏠         ▶️         📝 ⁵        📅         👤        │
│  Home    Simulado    Revisão    Histórico    Perfil      │
│                         ↑                               │
│                    badge com nº                         │
│                    de cards pendentes hoje              │
└─────────────────────────────────────────────────────────┘
```

## Rotas

| Aba | Rota | Componente | Badge |
|---|---|---|---|
| Home | `/` | `Home.tsx` | — |
| Simulado | `/simulado` | `Simulado.tsx` | — |
| Revisão | `/revisao` | `Revisao.tsx` | `totalPending` do `useSrs()` |
| Histórico | `/historico` | `Historico.tsx` | — |
| Perfil | `/perfil` | `Perfil.tsx` | — |

## Comportamento do badge

- Aparece no ícone da aba **Revisão**
- Valor = `useSrs().totalPending` (cards com `dueDate <= hoje`)
- Some quando `totalPending === 0`
- Máximo exibido: `99+`

## Modo imersivo

Durante o simulado (`state === 'running'`), o BottomNav é **ocultado** e substituído pela `ImmersiveBar`.

```
estado normal:
  BottomNav visível em todas as telas

estado imersivo (simulado rodando):
  BottomNav oculto
  ImmersiveBar no topo: [Sair]  Q.3/12  [timer]  [Mapa]
```
