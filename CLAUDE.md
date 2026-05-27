# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minimal React web app with Google authentication powered by Firebase and the full Google stack.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + TypeScript |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firestore |
| Hosting | Firebase Hosting |
| Functions | Firebase Cloud Functions (when needed) |
| Storage | Firebase Storage (when needed) |
| Styling | Tailwind CSS |

## Package Manager

**SEMPRE usar `pnpm`** — nunca `npm` ou `yarn` neste projeto.

```bash
pnpm install      # instalar dependências
pnpm dev          # dev server
pnpm build        # build produção
pnpm lint         # lint
pnpm typecheck    # type check
```

## Commands

```bash
# Install dependencies
pnpm install

# Dev server
pnpm dev

# Build for production
pnpm build

# Deploy to Firebase Hosting
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Run tests
pnpm test

# Run single test file
pnpm test -- src/path/to/file.test.ts

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Architecture

```
src/
├── firebase/          # Firebase config and SDK initialization
│   └── index.ts       # initializeApp, auth, db, storage exports
├── hooks/             # Custom React hooks
│   ├── useAuth.ts     # Firebase auth state (onAuthStateChanged)
│   └── useFirestore.ts
├── pages/             # Route-level components
│   ├── Login.tsx      # Google sign-in entry point
│   └── Home.tsx       # Post-auth main page
├── components/        # Reusable UI components
├── contexts/          # React contexts (AuthContext)
└── main.tsx           # App entry + Router + AuthProvider
```

## Firebase Setup

- Project config lives in `src/firebase/index.ts` — loaded from env vars (`VITE_FIREBASE_*`)
- `.env.local` holds the Firebase project credentials (never committed)
- Auth flow: `signInWithPopup(auth, googleProvider)` → `onAuthStateChanged` → `AuthContext`
- Protected routes check `AuthContext` and redirect to `/login` when unauthenticated

## Environment Variables

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
- Antes de rodar Playwright, garantir que `.env.local` existe no worktree (copiar de `~/Documents/dev/poscomp/.env.local`)

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

<!-- token-policy: v1.0 -->
