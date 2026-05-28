# Simulado — Diagrama de Sequência

```
┌──────────┐   ┌───────────────┐   ┌──────────────┐
│ Usuário  │   │ useSimulado   │   │  Firestore   │
└────┬─────┘   └──────┬────────┘   └──────┬───────┘
     │                │                   │
     │  Configura e   │                   │
     │  clica Iniciar │                   │
     │───────────────>│                   │
     │                │ start(config)     │
     │                │ GET /questions    │
     │                │──────────────────>│
     │                │<──────────────────│
     │                │ shuffle + slice   │
     │                │ startTimer()      │
     │                │ state='running'   │
     │                │                   │
     │  [para cada questão]               │
     │                │                   │
     │  select(opção) │                   │
     │───────────────>│                   │
     │                │ setSelectedOption │
     │                │                   │
     │  next(conf.)   │                   │
     │───────────────>│                   │
     │  ou skip()     │                   │
     │                │ grava AnswerRecord│
     │                │ {questionId,      │
     │                │  selected,        │
     │                │  correct,         │
     │                │  confidence}      │
     │                │                   │
     │  [última questão ou timer zera]    │
     │                │                   │
     │                │ finish()          │
     │                │ POST /users/{uid} │
     │                │  /results         │
     │                │──────────────────>│
     │                │<──────────────────│
     │                │                   │
     │                │ upsertFromResult()│
     │                │ SET /users/{uid}  │
     │                │  /srs_cards/{qid} │
     │                │──────────────────>│
     │                │<──────────────────│
     │                │ state='finished'  │
     │<───────────────│                   │
```

## Estados do Simulado

```
idle ──> config ──> running ──> finished
  ^                                │
  └────────────────────────────────┘
             retry()
```

## Regras de negócio

| Ação | Quando |
|------|--------|
| `select(opt)` | Usuário escolhe uma alternativa |
| `next(conf)` | Após revelar gabarito — registra confiança |
| `skip()` | Pula questão sem responder |
| `finish()` | Última questão respondida OU timer zerou |

## O que vai para o SRS após o simulado

Só questões que se enquadram em uma das condições:
- Foram **erradas** (`correct = false`)
- Foram classificadas com confiança (`confidence != null`)
