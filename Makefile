.DEFAULT_GOAL := help

# ── Sub-command absorption ────────────────────────────────────────────────────
# Leaf words that appear as 2nd/3rd goals after a namespace become no-ops.
# Namespace targets (local, dev, func, app) use inline guards instead.
ifneq ($(filter local dev func app,$(firstword $(MAKECMDGOALS))),)
up down restart seed gf rf get-flagged resolve-flagged deploy install build lint typecheck test admin set-admin:
	@:
.DEFAULT:
	@:
endif

.PHONY: help validate \
        deploy-hosting deploy-functions deploy \
        local dev func app \
        up seed gf rf get-flagged resolve-flagged deploy admin \
        install build lint typecheck test

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "poscomp — POSCOMP prep app (React + Firebase)"
	@echo ""
	@echo "Usage: make <namespace> <command>"
	@echo ""
	@echo "app:"
	@echo "  make app install     Install frontend dependencies (pnpm)"
	@echo "  make app build       Build frontend for production"
	@echo "  make app lint        Lint (ESLint + Stylelint)"
	@echo "  make app typecheck   Type-check (tsc --noEmit)"
	@echo "  make app test        Run tests (Vitest)"
	@echo ""
	@echo "func:"
	@echo "  make func install    Install functions dependencies (npm)"
	@echo "  make func build      Compile Cloud Functions (tsc)"
	@echo "  make func lint       Lint Cloud Functions"
	@echo "  make func test       Run functions tests (Jest)"
	@echo ""
	@echo "local:"
	@echo "  make local up        Start Firebase emulators (builds functions first)"
	@echo "  make local down      Stop Firebase emulators (kill ports)"
	@echo "  make local restart   Stop + rebuild + start emulators"
	@echo "  make local app       Vite dev server connected to emulators (port 5173)"
	@echo "  make local admin     Admin panel dev server connected to emulators (port 5174)"
	@echo "  make local set-admin foo@bar.com         Set admin:true claim (emulator)"
	@echo "  make local seed      Seed questions into local Firestore emulator"
	@echo "  make local gf        List pending flagged questions (emulator)"
	@echo "  make local rf        Resolve a flagged question (emulator)"
	@echo ""
	@echo "dev:"
	@echo "  make dev app         Vite dev server connected to real Firebase (port 5173)"
	@echo "  make dev admin       Admin panel dev server connected to real Firebase (port 5174)"
	@echo "  make dev set-admin foo@bar.com           Set admin:true claim (prod, uses ADC)"
	@echo "  make dev seed        Seed questions into real Firestore (prod, uses ADC)"
	@echo "  make dev gf          List pending flagged questions (prod)"
	@echo "  make dev rf          Resolve a flagged question (prod)"
	@echo "  make dev deploy app   Deploy app to Firebase Hosting"
	@echo "  make dev deploy admin Deploy admin panel to Firebase Hosting"
	@echo "  make dev deploy func  Build + deploy Cloud Functions"
	@echo ""
	@echo "top-level:"
	@echo "  validate             Full pipeline: install → lint → typecheck → test → build"
	@echo ""

# ── app namespace ─────────────────────────────────────────────────────────────
app:
	@if [ "$(firstword $(MAKECMDGOALS))" != "app" ]; then exit 0; fi; \
	case "$(word 2,$(MAKECMDGOALS))" in \
		install)   pnpm install --frozen-lockfile ;; \
		build)     pnpm build ;; \
		lint)      pnpm lint ;; \
		typecheck) pnpm typecheck ;; \
		test)      pnpm test ;; \
		*) echo "Unknown: make app [install|build|lint|typecheck|test]"; exit 1 ;; \
	esac

# ── func namespace ────────────────────────────────────────────────────────────
func:
	@if [ "$(firstword $(MAKECMDGOALS))" != "func" ]; then exit 0; fi; \
	case "$(word 2,$(MAKECMDGOALS))" in \
		install) cd functions && npm install ;; \
		build)   cd functions && npm run build ;; \
		lint)    cd functions && npm run lint ;; \
		test)    cd functions && npm test ;; \
		*) echo "Unknown: make func [install|build|lint|test]"; exit 1 ;; \
	esac

# ── local namespace ───────────────────────────────────────────────────────────
local:
	@case "$(word 2,$(MAKECMDGOALS))" in \
		up) \
			cd functions && npm run build && cd .. && \
			firebase emulators:start --only auth,functions,firestore,storage ;; \
		down) \
			lsof -ti :4000,9099,8080,9199,4400,4500 | xargs kill -9 2>/dev/null; \
			echo "Emulators stopped." ;; \
		restart) \
			lsof -ti :4000,9099,8080,9199,4400,4500 | xargs kill -9 2>/dev/null; \
			cd functions && npm run build && cd .. && \
			firebase emulators:start --only auth,functions,firestore ;; \
		app) \
			VITE_USE_EMULATOR=true pnpm dev ;; \
		admin) \
			VITE_USE_EMULATOR=true pnpm --prefix $(CURDIR)/admin dev ;; \
		set-admin) \
			FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIREBASE_PROJECT_ID=poscomp-olivmath pnpm tsx scripts/set-admin.ts "$(word 3,$(MAKECMDGOALS))" ;; \
		seed) \
			FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath pnpm seed ;; \
		get-flagged|gf) \
			FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath npx tsx scripts/get-flagged.ts ;; \
		resolve-flagged|rf) \
			read -p "Enter flag ID to resolve: " id; \
			FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath npx tsx scripts/resolve-flagged.ts "$$id" ;; \
		*) echo "Unknown: make local [up|down|restart|app|admin|set-admin|seed|gf|rf]"; exit 1 ;; \
	esac

# ── dev namespace (prod) ──────────────────────────────────────────────────────
dev:
	@if [ "$(firstword $(MAKECMDGOALS))" != "dev" ]; then exit 0; fi; \
	case "$(word 2,$(MAKECMDGOALS))" in \
		app) \
			pnpm dev ;; \
		admin) \
			pnpm --prefix $(CURDIR)/admin dev ;; \
		set-admin) \
			FIREBASE_PROJECT_ID=poscomp-olivmath pnpm tsx scripts/set-admin.ts "$(word 3,$(MAKECMDGOALS))" ;; \
		seed) \
			FIREBASE_PROJECT_ID=poscomp-olivmath pnpm seed ;; \
		get-flagged|gf) \
			FIREBASE_PROJECT_ID=poscomp-olivmath npx tsx scripts/get-flagged.ts ;; \
		resolve-flagged|rf) \
			read -p "Enter flag ID to resolve: " id; \
			FIREBASE_PROJECT_ID=poscomp-olivmath npx tsx scripts/resolve-flagged.ts "$$id" ;; \
		deploy) \
			case "$(word 3,$(MAKECMDGOALS))" in \
				app)   firebase deploy --only hosting:app ;; \
				admin) pnpm --prefix $(CURDIR)/admin build && firebase deploy --only hosting:admin ;; \
				func)  cd functions && npm run build && cd .. && firebase deploy --only functions ;; \
				*) echo "Unknown: make dev deploy [app|admin|func]"; exit 1 ;; \
			esac ;; \
		*) echo "Unknown: make dev [app|admin|set-admin|seed|gf|rf|deploy]"; exit 1 ;; \
	esac

# ── Validate (full pipeline) ──────────────────────────────────────────────────
validate:
	$(MAKE) app install
	$(MAKE) func install
	$(MAKE) app lint
	$(MAKE) func lint
	$(MAKE) app typecheck
	$(MAKE) app test
	$(MAKE) func test
	$(MAKE) app build
	$(MAKE) func build
