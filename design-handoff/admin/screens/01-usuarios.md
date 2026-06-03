# Admin — Tela: Usuários

## Layout

```
┌──────────────────────────────────────────────────────┐
│ [busca por email / uid]          [Carregar mais]     │
├──────────────────────────────────────────────────────┤
│ Email              | Plano    | Status  | Ações      │
│ user@gmail.com     | Pro      | ativo   | [...]      │
│ other@gmail.com    | Free     | ativo   | [...]      │
│ banned@gmail.com   | Free     | INATIVO | [...]      │
└──────────────────────────────────────────────────────┘
```

## Ações por usuário (menu `[...]`)

| Ação                  | Function backend             | Confirmação? |
|-----------------------|------------------------------|--------------|
| Desabilitar conta     | `disableUser`                | Sim          |
| Habilitar conta       | `enableUser`                 | Não          |
| Conceder admin        | `setAdminRole`               | Sim          |
| Revogar admin         | `revokeAdminRole`            | Sim          |
| Resetar SRS           | `resetUserSrs`               | Sim — destrutivo |
| Conceder Pro (30d)    | `grantPremiumAdmin({ planType: 'pro' })` | Sim |
| Conceder Pro MAX (1a) | `grantPremiumAdmin({ planType: 'pro_max' })` | Sim |

## Paginação

- `listUsers` retorna 100 por página com `pageToken`
- Botão "Carregar mais" busca próxima página e appenda à lista

## Estados visuais

| Condição             | Visual                                        |
|----------------------|-----------------------------------------------|
| `disabled = true`    | linha com fundo vermelho suave + badge INATIVO|
| `isAdmin = true`     | badge ADMIN ao lado do email                  |
| `isPremium = true`   | badge com plano (Pro / Pro MAX)               |
| `premiumExpiresAt < now` | badge "EXPIRADO" (vermelho)              |
