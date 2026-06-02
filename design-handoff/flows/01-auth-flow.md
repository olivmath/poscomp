# Fluxo 1 — Autenticação

```
[Acesso à rota protegida]
        │
        ▼
  Autenticado?
  ┌──── Não ────► /login
  │                  │
  │         [Botão "Entrar com Google"]
  │                  │
  │         signInWithPopup()
  │                  │
  │         ┌── Sucesso ──► onAuthStateChanged ──► / (Home)
  │         └── Falha   ──► toast "Falha ao fazer login"
  │
  └──── Sim ────► rota solicitada
```

## Estados do fluxo

| Estado    | Tela               | Trigger                            |
|-----------|--------------------|------------------------------------|
| loading   | spinner no botão   | enquanto signInWithPopup() roda    |
| error     | mensagem embaixo   | exceção capturada                  |
| success   | redirect para /    | onAuthStateChanged recebe user     |

## Comportamento de redirect

- Se user já autenticado visitar `/login` → redirect para `/`
- Toda rota protegida sem user → redirect para `/login`
- Após login bem-sucedido → redirect para `/` (replace: true, sem back)
