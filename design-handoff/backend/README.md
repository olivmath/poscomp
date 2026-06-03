# Backend Handoff — POSCOMP App

## Stack

| Camada        | Tecnologia                              |
|---------------|-----------------------------------------|
| Runtime       | Firebase Cloud Functions v2 (Node.js)   |
| Linguagem     | TypeScript                              |
| Banco         | Cloud Firestore (NoSQL, document-based) |
| Auth          | Firebase Authentication (Google OAuth)  |
| Storage       | Firebase Storage (comprovantes PIX)     |
| Push          | Firebase Cloud Messaging (FCM)          |
| FP utilities  | fp-ts (Either, Option, pipe)            |
| Scheduler     | Cloud Scheduler (via onSchedule)        |

---

## Estrutura de arquivos

```
functions/src/
  index.ts               ← entry point: registra todas as functions
  types.ts               ← domínio: tipos, constantes, interfaces
  getSimuladoQuestions.ts
  finishSimulado.ts
  getPendingCards.ts
  reviewCard.ts
  deleteAllData.ts
  reportQuestion.ts
  premiumRequests.ts
  notifications.ts
  admin.ts               ← flagged questions (admin)
  adminUsers.ts          ← gestão de usuários (admin)
  adminQuestions.ts      ← CRUD de questões (admin)
  adminAnnouncements.ts  ← CRUD de announcements (admin)
  deleteFlaggedQuestion.ts

infra/firebase/
  firestore.rules        ← regras de segurança do Firestore
  storage.rules          ← regras de segurança do Storage
```

---

## Fluxos por jornada

Espelham os fluxos do app (`flows/`):

| Arquivo                  | Jornada                                    |
|--------------------------|--------------------------------------------|
| `01-auth-flow.md`        | Login Google + leitura inicial do perfil   |
| `02-simulado-flow.md`    | Busca de questões → resposta → gravação    |
| `03-revisao-flow.md`     | Fila SRS → flashcard → agendamento SM-2    |
| `04-historico-flow.md`   | Leitura de resultados + métricas client-side|
| `05-premium-flow.md`     | PIX config → upload → aprovação admin      |

---

## Grupos funcionais

| Grupo             | Functions                                                          |
|-------------------|--------------------------------------------------------------------|
| **Simulado**      | getSimuladoQuestions, finishSimulado                               |
| **Revisão (SRS)** | getPendingCards, reviewCard                                        |
| **Conta**         | deleteAllData                                                      |
| **Billing**       | submitPremiumRequest, reviewPremiumRequest, onPremiumRequestCreated|
| **Notificações**  | sendReviewReminder, sendStreakReminder, sendWeeklySimuladoReminder |
| **Admin — Users** | setAdminRole, revokeAdminRole, listUsers, disableUser, enableUser, resetUserSrs, grantPremiumAdmin |
| **Admin — Q&A**   | createQuestion, updateQuestion, deleteQuestion                     |
| **Admin — Flags** | getFlaggedQuestions, resolveFlaggedQuestion, deleteFlaggedQuestion |
| **Admin — Annc.** | createAnnouncement, updateAnnouncement, deleteAnnouncement         |

---

## Modelo de autenticação resumido

Dois níveis de acesso via Firebase Auth:

| Role  | Como é concedido                         | Verificação nas Functions             |
|-------|------------------------------------------|---------------------------------------|
| User  | qualquer conta Google autenticada        | `request.auth != null`                |
| Admin | custom claim `{ admin: true }` via SDK   | `request.auth.token.admin === true`   |

Não há JWT externo, OAuth2 próprio, nem middleware de API Gateway.
Toda autenticação é feita pelo Firebase SDK no cliente — o token JWT é gerado pelo Firebase e verificado automaticamente pelo SDK do Cloud Functions.

---

## Ambiente

```
Projeto Firebase: poscomp-olivmath
Region padrão: us-central1 (default Cloud Functions v2)
Emuladores locais:
  Auth:      localhost:9099
  Firestore: localhost:8080
  Functions: localhost:5001
  Storage:   localhost:9199
```
