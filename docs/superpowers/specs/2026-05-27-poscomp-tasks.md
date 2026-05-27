# Poscomp — Plano de Implementação

**Data:** 2026-05-27  
**Stack:** React (Vite) + TypeScript + Firebase (Auth + Firestore + Hosting) + @material/web (MD3) + GitHub Actions

---

## Task 1 — Criar repo GitHub + CI/CD

- [ ] Criar repositório público `poscomp` no GitHub (`gh repo create`)
- [ ] Adicionar remote `origin` e push do commit existente em `main`
- [ ] Criar `firebase.json` com config de Hosting (`public: dist`, SPA rewrite)
- [ ] Criar `.firebaserc` com placeholder do projeto Firebase
- [ ] Criar `.github/workflows/deploy.yml`:
  - Trigger: push em `main`
  - Steps: checkout → setup-node 20 → npm ci → npm run build → Firebase deploy
  - Secrets: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`
- [ ] Commit + push: `ci: add github actions deploy workflow`

---

## Task 2 — App React Hello World + deploy funcionando

- [ ] Scaffold com Vite: `npm create vite@latest . -- --template react-ts`
- [ ] Instalar dependências base: `npm install`
- [ ] Instalar `@material/web` (Web Components oficiais Google MD3)
- [ ] Criar página Hello World minimalista com MD3 (typography, surface, colors)
- [ ] Configurar `vite.config.ts` para build correto
- [ ] Testar build local: `npm run build`
- [ ] Completar `.github/workflows/deploy.yml` com todos os steps reais
- [ ] Configurar secrets no GitHub repo:
  - `FIREBASE_SERVICE_ACCOUNT` (JSON da service account Firebase)
  - `FIREBASE_PROJECT_ID`
- [ ] Commit + push → CI/CD dispara → deploy confirmado no Firebase Hosting
- [ ] Versão inicial: `"version": "0.1.0"` no `package.json`

---

## Task 3 — Configurar Firebase Auth (Google OAuth)

- [ ] Criar projeto Firebase (ou usar existente) no Console
- [ ] Habilitar Google Sign-In no Firebase Authentication
- [ ] Criar `.env.local` com as variáveis `VITE_FIREBASE_*`
- [ ] Adicionar `.env.local` ao `.gitignore`
- [ ] Criar `src/firebase/index.ts` — `initializeApp`, `getAuth`, `getFirestore`
- [ ] Criar `src/contexts/AuthContext.tsx` — `onAuthStateChanged` + Provider
- [ ] Criar `src/hooks/useAuth.ts` — consume `AuthContext`
- [ ] Configurar domínio autorizado no Firebase Console (domínio do Hosting)
- [ ] Configurar secrets de env no GitHub Actions (`VITE_FIREBASE_*`)
- [ ] Commit: `feat: configure firebase auth and firestore`

---

## Task 4 — Tela Login/Logout + animações + deploy final

- [ ] Criar `src/pages/Login.tsx`:
  - Botão "Sign in with Google" (MD3 FilledButton)
  - Layout centralizado, Material You surface
- [ ] Criar `src/pages/Home.tsx`:
  - Mensagem de boas-vindas com nome/foto do usuário (MD3)
  - Animação de **confete** ao fazer login (`canvas-confetti`)
  - Botão "Logout"
  - Animação **bye bye** ao fazer logout (fade out + wave emoji animado)
- [ ] Criar `src/components/ProtectedRoute.tsx` — redireciona para `/login` se não autenticado
- [ ] Configurar React Router: `/login` → Login.tsx, `/` → Home.tsx (protegida)
- [ ] Integrar Firestore: salvar `{ uid, displayName, email, lastLogin }` no doc do usuário ao logar
- [ ] Commit: `feat: login/logout UI with confetti and bye-bye animations`
- [ ] Push → CI/CD → deploy final confirmado
- [ ] Bump versão: `"version": "1.0.0"` no `package.json`

---

## Decisões Técnicas

| Decisão | Escolha |
|---------|---------|
| UI | `@material/web` — Web Components oficiais Google MD3 |
| CI/CD trigger | Push em `main` |
| Versionamento | Manual via `package.json` |
| Animação login | `canvas-confetti` |
| Animação logout | CSS keyframes + emoji |
| Auth flow | `signInWithPopup` → `onAuthStateChanged` |
| Firestore | Salvar perfil do usuário no login |

---

## Notas de Integração @material/web com React

- Web Components precisam ser registrados: `import '@material/web/button/filled-button.js'`
- TypeScript: adicionar `declare namespace JSX` ou usar `createElement` com tipos corretos
- Alternativa para types: `@lit-labs/react` wrapper (opcional)
