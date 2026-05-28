.PHONY: install install-functions \
        build build-functions \
        lint lint-functions \
        typecheck \
        test test-functions \
        validate \
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

# ── Deploy ────────────────────────────────────────────────────────────────────
deploy-hosting:
	firebase deploy --only hosting

deploy-functions: build-functions
	firebase deploy --only functions

deploy: validate deploy-hosting deploy-functions
