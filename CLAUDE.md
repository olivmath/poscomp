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

## Commands

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Run tests
npm test

# Run single test file
npm test -- src/path/to/file.test.ts

# Lint
npm run lint

# Type check
npm run typecheck
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

<!-- token-policy: v1.0 -->
