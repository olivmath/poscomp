# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minimal React web app with Google authentication powered by Firebase and the full Google stack.
Managed as a pnpm workspace with modules: `/app` (frontend), `/admin` (admin panel), and `/functions` (backend).
Use `Makefile` at root for cross-workspace commands.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + TypeScript |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firestore |
| Hosting | Firebase Hosting |
| Functions | Firebase Cloud Functions |
| Storage | Firebase Storage |
| Styling | Tailwind CSS |

## Package Manager & Commands

**SEMPRE usar `pnpm`** — nunca `npm` ou `yarn`.
Preferir usar o `Makefile` na raiz para orquestração.

```bash
make app install      # dependências do app
make app dev          # dev server do app
make app build        # build produção do app
make local up         # subir emuladores firebase
make dev deploy app   # deploy do app
```

---

## Architecture (app/)

```
app/src/
├── firebase/          # Firebase config e SDK
│   └── index.ts       # initializeApp, auth, db, storage
├── contexts/
│   ├── AuthContext.tsx        # user + loading via onAuthStateChanged
│   ├── SrsContext.tsx         # SrsProvider (evita double Firestore reads)
│   └── ImmersiveModeContext.tsx
├── hooks/
│   ├── useAuth.ts     # lê AuthContext
│   ├── useSimulado.ts # estado do simulado + timer + finish
│   ├── useRevisao.ts  # fila SRS priorizada (P1→P2→P3)
│   ├── useSrs.ts      # CRUD dos SrsCards no Firestore
│   ├── useResults.ts  # histórico de simulados
│   └── useTheme.ts
├── components/
│   ├── ProtectedRoute.tsx     # redireciona para /login se não autenticado
│   ├── ProtectedLayout.tsx    # ProtectedRoute + AppLayout
│   ├── AppLayout.tsx
│   └── BottomNav.tsx
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── Simulado.tsx   # idle → config → running → finished
│   ├── Revisao.tsx    # flashcard com gabarito + classificação
│   ├── Historico.tsx  # lista de resultados
│   └── Perfil.tsx
├── utils/
│   ├── sm2.ts         # algoritmo SM-2 para espaçamento
│   ├── bypass.ts      # isAuthBypassed() — dev/E2E bypass
│   └── areaIcons.ts
├── types/index.ts     # Confidence, SrsCard, SimuladoResult, etc.
└── main.tsx           # AuthProvider > SrsProvider > ImmersiveModeProvider > Routes
```

### Invariantes de contexto
- `SrsProvider` fica dentro de `AuthProvider` mas fora de `ProtectedRoute` — carrega SRS data assim que o user resolve
- `useSrs` inicia `loading = true` para evitar flash de "empty" antes dos dados chegarem
- `useSrsContext` lança se usado fora de `SrsProvider` (guard explícito)

## Firebase Setup

- Project config lives in `app/src/firebase/index.ts` — loaded from env vars (`VITE_FIREBASE_*`)
- `app/.env.local` holds the Firebase project credentials (never committed)
- Auth flow: `signInWithPopup(auth, googleProvider)` → `onAuthStateChanged` → `AuthContext`
- Rules located in `infra/firebase/`

## Environment Variables

Localizadas em `app/.env.local`:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Playwright (inspeção visual)

- MCP server: `playwright` — use para tirar screenshots e inspecionar o app rodando
- Screenshots ficam em `.playwright-screenshots/` (ignorado pelo git)
- Snapshots/logs do MCP ficam em `.playwright-mcp/` (ignorado pelo git)
- Para inspecionar Shadow DOM de Web Components (ex: `md-filled-button`):
  - `getComputedStyle` no host **não** reflete o interior — use `element.shadowRoot.querySelector(...)`
  - CSS custom properties (`--md-*`) **penetram** o Shadow DOM; `font-family` herdado **não** penetra
- Antes de rodar Playwright, garantir que `app/.env.local` existe no worktree (copiar de `~/Documents/dev/poscomp/.env.local`)

## Accounts & Identity

| Serviço | Conta a usar |
|---------|-------------|
| gcloud / Firebase | `olivmath97@gmail.com` (conta pessoal) |
| git / GitHub | `olivmath` — **NÃO** usar `olivmath-oken` neste projeto |

- Firebase project criado do zero com `olivmath97@gmail.com`
- Sempre ativar conta antes de usar gcloud: `gcloud config set account olivmath97@gmail.com`

## Git Signing — OBRIGATÓRIO neste projeto

- **Author/Committer**: `olivmath <olivmath@protonmail.com>` (local git config já setado)
- **Chave GPG**: `84768563AAC6281C` — chave EDDSA `[ultimate]`
- **Formato**: `openpgp`
- O worktree pode herdar `user.signingkey` errado de outro projeto — sempre verificar:
  ```bash
  git config user.signingkey   # deve ser 84768563AAC6281C
  ```
- Se errado, corrigir com: `git config user.signingkey 84768563AAC6281C`
- Verificar assinatura após commit: `git log -1 --show-signature`

## Logging Standards

- **Firebase Cloud Functions**: Use `firebase-functions/logger` for all server-side logging.
- **Pattern**:
    - **Entry**: `logger.info("Function <FunctionName> started", { uid, ...data })`
    - **Error**: `logger.error("Error in <FunctionName>", { uid, error: error.message, stack: error.stack })`
    - **Events**: `logger.info("Event description", { ...details })`

## Workflow Rules — OBRIGATÓRIO

- **Sem planos**: implemente diretamente, sem criar documentos de plano ou pedir aprovação prévia
- **PRs com labels**: SEMPRE criar PRs com `gh pr create --label "<major|minor|patch>"` — nunca subir PR sem label
  - `major`: breaking change ou redesign completo
  - `minor`: nova feature ou mudança visível ao usuário
  - `patch`: bugfix ou ajuste interno sem impacto na UX
- **Fidelidade ao padrão**: ser objetivo e seguir os padrões já implementados no projeto

<!-- token-policy: v1.0 -->
