# Admin Flow 4 — Announcements (Banners do App)

```
[Admin abre /announcements]
        │
        └── Leitura direta: query announcements (todos, ordenado por createdAt DESC)

[Criar banner]
        │
        └── createAnnouncement({ message, type, active, url?, expiresAt? })
              └── Se active=true: batch desativa todos os outros primeiro
                    Invariante: apenas 1 ativo por vez

[Editar banner]
        │
        └── updateAnnouncement({ id, ...campos parciais })
              └── Se active=true: batch desativa todos os outros primeiro

[Ativar banner existente]
        │
        └── updateAnnouncement({ id, active: true })
              └── Batch: desativa os outros + ativa este

[Deletar banner]
        │
        ├── Confirmação obrigatória
        └── deleteAnnouncement({ id })
```

## Ciclo de vida de um banner

```
criado (active=false)
        │
        └── ativado (active=true) ──► exibido no app
                  │
                  ├── expiresAt < now ──► some do app (verificação client-side)
                  │
                  └── desativado manualmente (active=false) ──► some do app
```

## Tipos e visual no app

| Tipo      | Cor de fundo sugerida    |
|-----------|--------------------------|
| `info`    | azul / surface-variant   |
| `warning` | amarelo / warning-container |
| `success` | verde / success-container |
