# Project Overview

Minimal React web app with Google authentication powered by Firebase and the full Google stack.
Managed as a pnpm workspace:
- `/app`: Main frontend application
- `/admin`: Administration panel
- `/functions`: Firebase Cloud Functions
- `/infra/firebase`: Firebase rules and configurations

Use the `Makefile` at the root for orchestration.

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

## Package Manager

**SEMPRE usar `pnpm`** — nunca `npm` ou `yarn` neste projeto.

```bash
make app install      # instalar dependências do app
make app dev          # dev server do app
make app build        # build produção do app
```

## Commands

Use the root `Makefile` for most tasks:

```bash
make help             # list available commands
make local up         # start firebase emulators
make dev deploy app   # deploy frontend
make dev deploy func  # deploy functions
```

## Architecture (app/)

```
app/src/
├── firebase/          # Firebase config and SDK initialization
│   └── index.ts       # initializeApp, auth, db, storage exports
├── hooks/             # Custom React hooks
│   ├── useAuth.ts     # Firebase auth state (onAuthStateChanged)
│   └── useSrs.ts
├── pages/             # Route-level components
│   ├── Login.tsx      # Google sign-in entry point
│   └── Home.tsx       # Post-auth main page
├── components/        # Reusable UI components
├── contexts/          # React contexts (AuthContext, SrsContext)
└── main.tsx           # App entry + Router + AuthProvider
```

## Firebase Setup

- Project config lives in `app/src/firebase/index.ts` — loaded from env vars (`VITE_FIREBASE_*`)
- `app/.env.local` holds the Firebase project credentials (never committed)
- Rules located in `infra/firebase/`
- Auth flow: `signInWithPopup(auth, googleProvider)` → `onAuthStateChanged` → `AuthContext`

## Environment Variables

Located in `app/.env.local`:
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
  - CSS custom properties (`--md-*`) **penetram** the Shadow DOM; `font-family` herdado **não** penetra
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

## Fluxo de Dados SRS (Revisão Espaçada)

1. **Simulado (Origem)**: Ao finalizar o simulado (`finishSimulado.ts`), o sistema gera/atualiza registros na coleção `users/{uid}/srs_cards`.
2. **Revisão (Consumo)**: O front-end chama `getPendingCards`, que:
    - Busca `srs_cards` pendentes (data de revisão ≤ agora).
    - Busca as `Question` correspondentes na coleção global `questions` (que contém o campo `card` com `pergunta` e `resposta`).
    - Retorna ao front-end os dados do card + conteúdo da questão formatado.
3. **Ajuste (Feedback)**: Após o usuário estudar o flashcard (pergunta/resposta), o front-end chama `reviewCard.ts`, que atualiza os parâmetros do algoritmo SM-2 e a próxima data de revisão no Firestore.


Todo trabalho visual (componente, página, ajuste de estilo) deve seguir estas regras sem exceção:

- **Material 3 MCP**: consultar `mcp__material3__get_design_tokens`, `get_component_code` e `get_accessibility_guidelines` antes de implementar qualquer UI
- **Mobile-first**: otimizar para telas pequenas primeiro; desktop é aprimoramento
- **Tokens sempre**: usar `--md-sys-*` definidos em `src/index.css` — zero valores hardcoded (px, cores, pesos)
- **Acessibilidade máxima**: `aria-label` em todos os controles interativos, touch targets ≥ 48px, contraste WCAG AA
- **1× de leitura**: hierarquia tipográfica clara — `title-large` (título) → `label-large` (rótulo de seção) → `body` (conteúdo)
- **Consistência**: seguir os padrões de classe CSS já existentes no projeto (`simulado-card`, `config-section`, `home-container--dashboard`, etc.)

## Workflow Rules — OBRIGATÓRIO

- **Sem planos**: implemente diretamente, sem criar documentos de plano ou pedir aprovação prévia
- **PRs com labels**: sempre criar PRs com labels `major`, `minor` ou `patch` conforme o impacto
- **Fidelidade ao padrão**: ser objetivo e seguir os padrões já implementados no projeto

<!-- token-policy: v1.0 -->
