# Login — Diagrama de Sequência

```
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐
│ Usuário  │   │ AuthContext  │   │  SrsContext  │   │ Firestore│
└────┬─────┘   └──────┬───────┘   └──────┬───────┘   └────┬─────┘
     │                │                  │                 │
     │  Clica "Entrar │                  │                 │
     │  com Google"   │                  │                 │
     │───────────────>│                  │                 │
     │                │ signInWithPopup  │                 │
     │                │─────────────────────────────────> Firebase Auth
     │                │<─────────────────────────────────
     │                │ onAuthStateChanged(user)           │
     │                │ setUser(user)                      │
     │                │ setLoading(false)                  │
     │                │                  │                 │
     │                │──────────────────>                 │
     │                │   user resolvido │                 │
     │                │                  │ loadPendingCards│
     │                │                  │────────────────>│
     │                │                  │ /users/{uid}/   │
     │                │                  │  srs_cards      │
     │                │                  │<────────────────│
     │                │                  │ filtra dueDate  │
     │                │                  │ <= hoje         │
     │                │                  │ setPendingCards  │
     │                │                  │                 │
     │  Redireciona   │                  │                 │
     │  para /        │                  │                 │
     │<───────────────│                  │                 │
```

## O que acontece

1. Usuário clica no botão Google
2. Firebase abre popup de autenticação
3. `AuthContext` recebe o usuário via `onAuthStateChanged`
4. `SrsContext` detecta o usuário resolvido e carrega os cards SRS pendentes do Firestore
5. `ProtectedRoute` libera o acesso e redireciona para `/`
