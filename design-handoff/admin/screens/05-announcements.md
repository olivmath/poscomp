# Admin — Tela: Announcements (Banners)

## Layout

```
┌──────────────────────────────────────────────────────┐
│                                    [+ Novo banner]   │
├──────────────────────────────────────────────────────┤
│ Mensagem              | Tipo    | Ativo | Expira     │
│ "Manutenção amanhã"   | warning | SIM   | 03/06      │
│ "Novo banco 2024!"    | info    | NÃO   | —          │
└──────────────────────────────────────────────────────┘
```

## Formulário — criar / editar

```
┌──────────────────────────────────────────────────────┐
│ Mensagem (markdown):                                 │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [textarea]                                       │ │
│ └──────────────────────────────────────────────────┘ │
│ Preview:                                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [renderização markdown em tempo real]            │ │
│ └──────────────────────────────────────────────────┘ │
│ Tipo:      ( ) info  ( ) warning  ( ) success        │
│ URL (opcional): [____]  (link ao clicar no banner)  │
│ Expira em: [data/hora]  (vazio = sem expiração)     │
│ Ativo:     [switch]                                  │
│                                                      │
│ [Cancelar]                          [Salvar]         │
└──────────────────────────────────────────────────────┘
```

O preview renderiza em tempo real enquanto o admin digita — mesmo engine de markdown do app.

## Ações por linha

| Ação        | Function backend       | Comportamento                              |
|-------------|------------------------|--------------------------------------------|
| Editar      | `updateAnnouncement`   | Atualiza campos; não altera outros banners |
| Ativar/Desativar | `updateAnnouncement({ active: true/false })` | Só altera este banner |
| Deletar     | `deleteAnnouncement`   | Confirmação obrigatória                    |

## Exibição no app (carousel)

Todos os banners com `active=true` e `expiresAt > now` aparecem como slides na Home, ordenados por `createdAt` ASC. O admin controla quantos ficam ativos ao mesmo tempo.

- Texto renderizado como markdown
- Dismissível pelo usuário (persiste no `localStorage` — não no backend)
- Expiração verificada no cliente: `expiresAt < now` → slide não aparece mesmo se `active = true`
