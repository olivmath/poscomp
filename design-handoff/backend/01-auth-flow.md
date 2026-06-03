# Backend — Fluxo 1: Autenticação

Não há Cloud Function neste fluxo. Toda autenticação é tratada pelo Firebase SDK.

```
Cliente
  │
  ├── signInWithPopup(googleProvider)
  │         │
  │        ▼
  │   Firebase Auth
  │   ├── valida credencial Google
  │   └── emite Firebase ID Token (JWT)
  │         │
  │        ▼
  │   onAuthStateChanged → user disponível no app
  │
  └── httpsCallable(function)(payload)
            │  Firebase SDK inclui ID Token no header automaticamente
           ▼
       Cloud Function
       ├── request.auth.uid   → UID do usuário
       └── request.auth.token → claims do JWT (inclui custom claims)
```

## Leitura inicial do perfil

Após login, o frontend faz `onSnapshot` do documento `users/{uid}`:

| Campo lido          | Uso no app                                              |
|---------------------|---------------------------------------------------------|
| `isPremium`         | libera/bloqueia Revisão e Histórico                     |
| `premiumExpiresAt`  | verifica expiração no cliente (se `< now` → trata como free) |
| `premiumStatus`     | exibe estado na tela Perfil                             |
| `notificationsEnabled` | estado inicial do switch de notificações             |
| `activeDays`        | WeekHeader — círculos de dias com atividade             |
| `lastActivity`      | `sendStreakReminder` — base para calcular streak em risco|

**Nota**: `users/{uid}` não é criado no login — só existe após o primeiro `finishSimulado` ou concessão de premium.

## Acesso negado

- Function sem `request.auth` → `unauthenticated`
- Function admin sem claim `{ admin: true }` → `permission-denied`
- Rota protegida sem user no frontend → redirect `/login`
