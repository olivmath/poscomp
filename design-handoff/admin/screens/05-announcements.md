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
│ Mensagem:  [textarea — suporte a markdown]           │
│ Tipo:      ( ) info  ( ) warning  ( ) success        │
│ URL (opcional): [____]  (link ao clicar no banner)  │
│ Expira em: [data/hora]  (vazio = sem expiração)     │
│ Ativo:     [switch]                                  │
│                                                      │
│ [Cancelar]                          [Salvar]         │
└──────────────────────────────────────────────────────┘
```

## Ações por linha

| Ação    | Function backend       | Comportamento                                           |
|---------|------------------------|----------------------------------------------------------|
| Editar  | `updateAnnouncement`   | Se `active=true`, desativa todos os outros primeiro      |
| Deletar | `deleteAnnouncement`   | Confirmação obrigatória                                  |
| Ativar  | `updateAnnouncement({ active: true })` | Desativa todos os outros automaticamente |

## Invariante

Apenas **1 announcement ativo** por vez — o backend garante via batch ao criar/ativar.
A tela deve refletir isso: ao ativar um banner, os outros ficam com `ativo = NÃO` imediatamente.

## Exibição no app

O banner aparece na Home (`/`) acima do WeekHeader.
- Texto renderizado como markdown
- Dismissível pelo usuário (persiste no `localStorage` do cliente — não no backend)
- Expiração verificada no cliente: `expiresAt < now` → não exibe mesmo se `active = true`
