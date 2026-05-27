# Perfil — Usuário e Configurações

Dados do usuário logado e preferências do aplicativo.

---

## Estado: logado

```
┌─────────────────────────────────────────┐
│                                         │
│                [foto]                   │
│            Lucas Oliveira               │
│        olivmath@protonmail.com          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  PREFERÊNCIAS                           │
│  ┌─────────────────────────────────┐    │
│  │ 🌙 Tema escuro         [ toggle ] │    │
│  │ 🔔 Notificações        [ toggle ] │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  CONTA                                  │
│  ┌─────────────────────────────────┐    │
│  │ 👤 Nome          Lucas Oliveira   │    │
│  │ ✉️ E-mail         olivmath@...     │    │
│  │ 🛡️ Autenticação   Google           │    │
│  │ ℹ️ Versão         v1.2.0           │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [ Sair da conta ]                      │
│                                         │
└─────────────────────────────────────────┘
  🏠       ▶️       📝 ⁵     📅       👤
```

---

## Comportamento do Logout

Ao clicar em "Sair da conta":
1. Exibe spinner no botão ou overlay de carregamento.
2. Executa `signOut(auth)`.
3. Navega para `/login`.

---

## Tema Escuro / Claro

- Toggle altera a propriedade `theme` via `useTheme()`.
- Persiste a preferência no `localStorage`.
- Aplica classes CSS globais ou variáveis do MD3 (`--md-sys-color-...`).

---

## Detalhes Técnicos

| Item | Origem |
|---|---|
| Foto | `user.photoURL` |
| Nome | `user.displayName` |
| E-mail | `user.email` |
| Versão | `__APP_VERSION__` (via Vite define) |
