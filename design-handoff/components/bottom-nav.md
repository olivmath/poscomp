# Componente — BottomNav

## Tabs

| Index | Label    | Rota         | Ícone              | Badge               |
|-------|----------|--------------|--------------------|---------------------|
| 0     | Home     | `/`          | `home`             | —                   |
| 1     | Revisão  | `/revisao`   | `article`          | nº de cards pendentes (some se 0) |
| 2     | Histórico| `/historico` | `history`          | —                   |
| 3     | Perfil   | `/perfil`    | `person`           | —                   |

## Comportamento

- Tab ativa = baseada no pathname atual (matching por prefixo para rotas aninhadas)
- `/historico/:id` → tab Histórico ativa (index 2)
- Em modo imersivo (`isImmersive = true`) → componente some completamente

## Badge

- Número de SRS cards com `nextDue <= hoje` pendentes
- Exibido no canto superior direito do tab Revisão
- Texto: número exato até 99, "99+" acima disso
- Some quando `totalPending === 0`
