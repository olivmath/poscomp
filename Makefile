.DEFAULT_GOAL := help

.PHONY: help \
        install install-functions \
        build build-functions \
        lint lint-functions \
        typecheck \
        test test-functions \
        validate \
        emulators dev-local seed-local \
        deploy-hosting deploy-functions deploy

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  install              pnpm install --frozen-lockfile"
	@echo "  install-functions    npm install em functions/"
	@echo "  build                pnpm build"
	@echo "  build-functions      npm run build em functions/"
	@echo "  lint                 pnpm lint"
	@echo "  lint-functions       npm run lint em functions/"
	@echo "  typecheck            pnpm typecheck"
	@echo "  test                 pnpm test"
	@echo "  test-functions       npm test em functions/"
	@echo "  validate             pipeline completo (lint+typecheck+test+build)"
	@echo "  emulators            Firebase emulators (auth, functions, firestore)"
	@echo "  dev-local            dev server com emulators"
	@echo "  seed-local           seed dados no emulator Firestore"
	@echo "  deploy-hosting       firebase deploy --only hosting"
	@echo "  deploy-functions     build + firebase deploy --only functions"
	@echo "  deploy               validate + deploy completo"
	@echo ""

# ── Install ────────────────────────────────────────────────────────────────────
install:
	pnpm install --frozen-lockfile

install-functions:
	cd functions && npm install

# ── Build ──────────────────────────────────────────────────────────────────────
build:
	pnpm build

build-functions:
	cd functions && npm run build

# ── Lint ───────────────────────────────────────────────────────────────────────
lint:
	pnpm lint

lint-functions:
	cd functions && npm run lint

# ── Typecheck ──────────────────────────────────────────────────────────────────
typecheck:
	pnpm typecheck

# ── Test ───────────────────────────────────────────────────────────────────────
test:
	pnpm test

test-functions:
	cd functions && npm test

# ── Validate (full local pipeline) ────────────────────────────────────────────
validate: install install-functions lint lint-functions typecheck test build build-functions

# ── Local dev ─────────────────────────────────────────────────────────────────
emulators: build-functions
	firebase emulators:start --only auth,functions,firestore

dev-local:
	VITE_USE_EMULATOR=true pnpm dev

seed-local:
	FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath pnpm seed

# ── Admin (Flagged Questions) ─────────────────────────────────────────────────
get-flagged:
	npx tsx scripts/get-flagged.ts

resolve-flagged:
	@read -p "Enter flag ID to resolve: " id; \
	npx tsx scripts/resolve-flagged.ts "$$id"

# ── Deploy ────────────────────────────────────────────────────────────────────
deploy-hosting:
	firebase deploy --only hosting

deploy-functions: build-functions
	firebase deploy --only functions

deploy: validate deploy-hosting deploy-functions
