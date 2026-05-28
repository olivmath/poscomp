# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

App de preparação para o POSCOMP. Simulados cronometrados + revisão espaçada (SM-2) com classificação de confiança por questão.

**Objetivo pedagógico**: reduzir progressivamente erros do tipo "devia saber" — não acumular conteúdo novo infinitamente.

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

## Pedagogical Model — Processo Simulado + Revisão

O app implementa este ciclo:

```
Simulado → classificar erro por questão → Revisão direcionada → Reteste → Novo Simulado
```

### Classificação de confiança (durante simulado, após revelar gabarito)

| Label | Tipo | Quando usar |
|---|---|---|
| NÃO SEI (`unsure`) | nunca viu ou não lembra nada | "Não faço ideia" |
| ESTUDANDO (`studying`) | conhecimento parcial ou confuso | "Eu quase lembrava" |
| DEVIA SABER (`should_know`) | estudou várias vezes, erro inadmissível | "Eu sabia isso" |
| TENHO CERTEZA (`certain`) | acertou com confiança total | sem revisão necessária |

### Prioridade da revisão

```
DEVIA SABER  →  ESTUDANDO  →  NÃO SEI
   (P1)            (P2)          (P3)
```

Erros "inadmissíveis" têm prioridade máxima — a aprovação depende de consistência, não de conteúdo novo.

### Fluxo por questão no simulado

```
seleciona opção → revela gabarito → vê certo/errado → classifica confiança → próxima
```

**Nunca** classificar antes de ver o gabarito — a categoria depende de saber se acertou.

---

## Architecture

```
src/
├── firebase/          # Firebase config e SDK
│   └── index.ts       # initializeApp, auth, db, storage
├── hooks/
│   ├── useAuth.ts     # onAuthStateChanged
│   ├── useSimulado.ts # estado do simulado + timer + finish
│   ├── useRevisao.ts  # fila SRS priorizada (P1→P2→P3)
│   ├── useSrs.ts      # CRUD dos SrsCards no Firestore
│   ├── useResults.ts  # histórico de simulados
│   └── useTheme.ts
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── Simulado.tsx   # idle → config → running → finished
│   ├── Revisao.tsx    # flashcard com gabarito + classificação
│   ├── Historico.tsx  # lista de resultados
│   └── Perfil.tsx
├── utils/
│   └── sm2.ts         # algoritmo SM-2 para espaçamento
├── types/index.ts     # Confidence, SrsCard, SimuladoResult, etc.
└── main.tsx
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
