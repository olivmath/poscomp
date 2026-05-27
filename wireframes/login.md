# Login — Acesso ao App

Porta de entrada do aplicativo. Autenticação via Google OAuth.

---

## Estado: inicial

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                 [LOGO]                  │
│                POSCOMP                  │
│                                         │
│        Prepare-se para o sucesso        │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│          [ G Entrar com Google ]        │
│                                         │
│                                         │
│                                         │
│   Ao entrar, você concorda com nossos   │
│   Termos e Políticas de Privacidade.    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Estado: carregando

Ao clicar no botão de login.

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                 [LOGO]                  │
│                POSCOMP                  │
│                                         │
│                                         │
│                                         │
│               [spinner]                 │
│                                         │
│            Autenticando...              │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Estado: erro

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│          [ G Entrar com Google ]        │
│                                         │
│    ⛔ Falha ao fazer login.             │
│    Tente novamente.                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Requisitos

- **Firebase Auth**: `signInWithPopup(auth, googleProvider)`.
- **Redirect**: Após sucesso, navega para `/`.
- **Estilo**: Botão seguindo o padrão Material Design 3 (MD3).
- **Logo**: SVG estilizado com a letra "P".
