.PHONY: install install-functions \
        build build-functions \
        lint lint-functions \
        typecheck \
        test test-functions \
        validate \
        emulators dev-local seed-local \
        deploy-hosting deploy-functions deploy

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

# ── Deploy ────────────────────────────────────────────────────────────────────
deploy-hosting:
	firebase deploy --only hosting

deploy-functions: build-functions
	firebase deploy --only functions

deploy: validate deploy-hosting deploy-functions
