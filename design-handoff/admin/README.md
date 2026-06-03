# Admin Handoff — POSCOMP App

Painel web interno para operações administrativas. Não é uma rota do app do usuário — é uma interface separada (ou conjunto de scripts/console) usada pelos admins.

## Acesso

- Mesma autenticação Google do app
- Requer custom claim `{ admin: true }` configurado via `setAdminRole`
- Sem admin claim → todas as functions admin retornam `permission-denied`

---

## Módulos

| Módulo           | Arquivo                          | Functions backend usadas                                    |
|------------------|----------------------------------|-------------------------------------------------------------|
| Usuários         | `screens/01-usuarios.md`         | listUsers, disableUser, enableUser, resetUserSrs, grantPremiumAdmin, setAdminRole |
| Questões         | `screens/02-questoes.md`         | createQuestion, updateQuestion, deleteQuestion              |
| Reports          | `screens/03-flags.md`            | getFlaggedQuestions, resolveFlaggedQuestion, deleteFlaggedQuestion |
| Premium          | `screens/04-premium.md`          | reviewPremiumRequest (approve/deny)                         |
| Announcements    | `screens/05-announcements.md`    | createAnnouncement, updateAnnouncement, deleteAnnouncement  |

---

## Fluxos

| Arquivo                       | Descrição                                    |
|-------------------------------|----------------------------------------------|
| `flows/01-questoes-flow.md`   | Criar, editar e remover questões do banco     |
| `flows/02-premium-flow.md`    | Revisar e aprovar/negar tickets de assinatura |
| `flows/03-flags-flow.md`      | Triagem de questões reportadas por usuários   |
| `flows/04-announcements-flow.md` | Publicar e gerenciar banners do app        |

---

## Stack (assumida)

Não há painel admin dedicado implementado — as operações são feitas via Firebase Console + scripts CLI ou via painel a ser construído. Este handoff especifica o que o painel deveria ter.
