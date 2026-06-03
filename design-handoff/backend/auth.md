# Autenticação e Autorização

## Fluxo de autenticação

```
Cliente
  │
 ├─ signInWithPopup(googleProvider)
  │        │
  │       ▼
  │ Firebase Auth
  │ ├─ valida credencial Google
  │ └─ emite Firebase ID Token (JWT)
  │        │
  │       ▼
  │ onAuthStateChanged → user disponível no app
  │
 └─ httpsCallable('nomeDaFunction')(payload)
           │
           │ Firebase SDK inclui o ID Token automaticamente no header
           ▼
      Cloud Function
      ├─ SDK verifica o token (automático, sem código manual)
      ├─ request.auth.uid  → UID do usuário
      ├─ request.auth.token → claims do JWT (inclui custom claims)
      └─ lógica da function
```

## Níveis de acesso

```
┌──────────────────────────────────────────────────────┐
│ Público                                             │
│ (nenhuma function — não há endpoints públicos)     │
├──────────────────────────────────────────────────────┤
│ Usuário autenticado  (request.auth != null)         │
│ ├─ getSimuladoQuestions                             │
│ ├─ finishSimulado                                   │
│ ├─ getPendingCards                                  │
│ ├─ reviewCard                                       │
│ ├─ deleteAllData                                    │
│ ├─ submitPremiumRequest                             │
│ ├─ reportQuestion                                   │
│ └─ getFlaggedQuestions (deveria ser admin — bug)    │
│    resolveFlaggedQuestion (deveria ser admin — bug) │
├──────────────────────────────────────────────────────┤
│ Admin  (request.auth.token.admin === true)          │
│ ├─ reviewPremiumRequest                             │
│ ├─ setAdminRole / revokeAdminRole                   │
│ ├─ listUsers / disableUser / enableUser             │
│ ├─ resetUserSrs / grantPremiumAdmin                 │
│ ├─ createQuestion / updateQuestion / deleteQuestion │
│ ├─ createAnnouncement / updateAnnouncement          │
│ ├─ deleteAnnouncement                               │
│ └─ deleteFlaggedQuestion                            │
└──────────────────────────────────────────────────────┘
```

## Custom Claims (Firebase Auth)

Único custom claim atual: `{ admin: true }`.

| Claim       | Tipo    | Quem seta                            |
|-------------|---------|--------------------------------------|
| `admin`     | boolean | `setAdminRole` / `revokeAdminRole`   |

**Importante**: custom claims são persistidos no Firebase Auth e embutidos no ID Token. O cliente não consegue forjar claims — são verificados server-side pelo SDK.

**Como conceder admin na prática**:
```bash
# Via Makefile (emulador)
make local set-admin email@exemplo.com

# Via script direto
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
  npx tsx scripts/set-admin.ts email@exemplo.com
```

## Premium: verificação no cliente

`isPremium` é lido do **documento Firestore** `users/{uid}`, não do JWT. Isso significa:
- Não há latência de propagação de token
- O cliente faz um `onSnapshot` do documento `users/{uid}` (via `AuthContext`)
- Se `isPremium=true` mas `premiumExpiresAt < now` → frontend trata como expirado (verificação no `useAuth`)

## Regras de segurança do Firestore

```
questions/{id}
  read: autenticado
  write: admin

users/{uid}
  read: dono OU admin
  write: admin (campos premium só via Cloud Functions)

users/{uid}/*  (srs_cards, results)
  read, write: dono OU admin

announcements/{id}
  read: autenticado
  write: admin

flagged_questions/{id}
  read: dono (resource.data.uid == auth.uid) OU admin
  write: admin (criação via Cloud Function, client não escreve diretamente)

premium_requests/{id}
  read: dono OU admin
  update: admin
  (create via Cloud Function — admin SDK bypassa regras)
```

## Regras de segurança do Storage

```
receipts/{uid}/{fileName}
  write: usuário autenticado E auth.uid == uid do path
  read:  usuário autenticado E (auth.uid == uid OU admin)
```

Isso garante que um usuário não consiga fazer upload em nome de outro, e não consiga ver comprovantes de outros usuários.

## Proteção contra injeção de dados

A combinação de regras Firestore + validação nas Cloud Functions cria 3 camadas de proteção no fluxo de billing:

1. **Storage rules**: o upload só vai para `receipts/{uid}/` do próprio usuário
2. **submitPremiumRequest**: verifica que `storagePath.startsWith('receipts/{uid}/')` antes de gerar a Signed URL
3. **Firestore rules**: `premium_requests` não tem `create` para clientes — só admin SDK (via Cloud Function) pode criar documentos nessa coleção

Isso torna impossível para um usuário injetar uma receiptUrl arbitrária ou criar um ticket falso.
