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

  // User — Simulado
  getSimuladoQuestions.ts
  finishSimulado.ts

  // User — Revisão
  getPendingCards.ts
  getPendingCount.ts
  getMateriaReviewStats.ts
  reviewCard.ts

  // User — Billing
  getPixConfig.ts
  premiumRequests.ts     ← submitPremiumRequest

  // User — Conta
  deleteAllData.ts
  reportQuestion.ts

  // Admin
  adminUsers.ts          ← setAdminRole, revokeAdminRole, listUsers, disableUser, enableUser, resetUserSrs, grantPremiumAdmin
  adminPremium.ts        ← reviewPremiumRequest
  adminQuestions.ts      ← createQuestion, updateQuestion, deleteQuestion
  adminFlags.ts          ← getFlaggedQuestions, resolveFlaggedQuestion, deleteFlaggedQuestion
  adminAnnouncements.ts  ← createAnnouncement, updateAnnouncement, deleteAnnouncement

  // Background
  notifications.ts       ← sendReviewReminder, sendStreakReminder, sendWeeklySimuladoReminder
  triggers.ts            ← onPremiumRequestCreated

infra/firebase/
  firestore.rules        ← regras de segurança do Firestore
  storage.rules          ← regras de segurança do Storage
```

---

## Fluxos por jornada

Espelham os fluxos do app (`flows/`):

| Arquivo                  | Jornada                                    |
|--------------------------|--------------------------------------------|
| `flows/01-auth-flow.md`        | Login Google + leitura inicial do perfil   |
| `flows/02-simulado-flow.md`    | Busca de questões → resposta → gravação    |
| `flows/03-revisao-flow.md`     | Fila SRS → flashcard → agendamento SM-2    |
| `flows/04-historico-flow.md`   | Leitura de resultados + métricas client-side|
| `flows/05-premium-flow.md`     | PIX config → upload → aprovação admin      |

---

## Capacidades do backend

| Função | O que faz |
|---|---|
| `getSimuladoQuestions` | Retorna questões embaralhadas filtradas por matéria e quantidade |
| `finishSimulado` | Grava resultado, atualiza SRS cards e registra questões flagadas |
| `getPendingCards` | Retorna fila de flashcards SRS vencidos, ordenados por prioridade |
| `getPendingCount` | Retorna o número de cards SRS vencidos (badge do BottomNav) |
| `getMateriaReviewStats` | Retorna próxima data de revisão e histórico por matéria |
| `reviewCard` | Aplica SM-2 num card e agenda a próxima revisão |
| `getPixConfig` | Retorna chave PIX e QR code gerado server-side |
| `submitPremiumRequest` | Cria ticket de assinatura com comprovante de pagamento |
| `deleteAllData` | Apaga todo o histórico de simulados e cards SRS do usuário |
| `reportQuestion` | Reporta um problema em uma questão (fora de simulado) |
| `reviewPremiumRequest` | Aprova ou nega um ticket de assinatura (admin) |
| `setAdminRole` / `revokeAdminRole` | Concede ou remove o papel de admin (admin) |
| `listUsers` | Lista todos os usuários paginados (admin) |
| `disableUser` / `enableUser` | Bloqueia ou desbloqueia o login de um usuário (admin) |
| `resetUserSrs` | Apaga todos os SRS cards de um usuário (admin) |
| `grantPremiumAdmin` | Concede premium diretamente sem comprovante (admin) |
| `createQuestion` | Cria uma nova questão no banco (admin) |
| `updateQuestion` | Atualiza campos de uma questão existente (admin) |
| `deleteQuestion` | Remove uma questão do banco (admin) |
| `getFlaggedQuestions` | Lista questões reportadas não resolvidas (admin)¹ |
| `resolveFlaggedQuestion` | Marca um report como resolvido (admin)¹ |
| `deleteFlaggedQuestion` | Remove um report do banco (admin) |
| `createAnnouncement` | Cria um banner de aviso no app (admin) |
| `updateAnnouncement` | Atualiza um banner existente (admin) |
| `deleteAnnouncement` | Remove um banner (admin) |
| `onPremiumRequestCreated` | Log automático quando um ticket de premium é criado (trigger) |
| `sendReviewReminder` | Push diário para usuários com cards SRS vencidos (9h BRT) |
| `sendStreakReminder` | Push diário para usuários sem atividade no dia (21h BRT) |
| `sendWeeklySimuladoReminder` | Push semanal de lembrete de simulado (segunda 9h BRT) |

¹ Auth ainda como `user` (bug — deve ser corrigida para `admin`, ver `requisitos-tecnicos.md`)

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
