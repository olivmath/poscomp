# Admin Flow 4 — Announcements (Banners do App)

```
[Admin abre /announcements]
        │
        └── Leitura direta: query announcements (todos, ordenado por createdAt DESC)

[Criar banner]
        │
        └── createAnnouncement({ message, type, active, url?, expiresAt? })
              └── Salva o documento — sem alterar outros banners

[Editar banner]
        │
        └── updateAnnouncement({ id, ...campos parciais })
              └── Atualiza campos — sem alterar outros banners

[Ativar / desativar banner]
        │
        └── updateAnnouncement({ id, active: true | false })
              └── Altera apenas este banner

[Deletar banner]
        │
        ├── Confirmação obrigatória
        └── deleteAnnouncement({ id })
```

## Ciclo de vida de um banner

```
criado (active=false)
        │
        └── ativado (active=true) ──► entra no carousel do app
                  │
                  ├── expiresAt < now ──► some do carousel (verificação client-side)
                  │
                  └── desativado manualmente (active=false) ──► some do carousel
```

O carousel exibe simultaneamente todos os banners `active=true` com `expiresAt > now`, ordenados por `createdAt` ASC.

## Tipos e visual no app

| Tipo      | Cor de fundo sugerida    |
|-----------|--------------------------|
| `info`    | azul / surface-variant   |
| `warning` | amarelo / warning-container |
| `success` | verde / success-container |
