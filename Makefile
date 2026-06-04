.DEFAULT_GOAL := help

ifneq ($(filter local dev func fn app admin,$(firstword $(MAKECMDGOALS))),)
up down restart seed gf rf get-flagged resolve-flagged deploy install build lint typecheck test set-admin:
	@:
.DEFAULT:
	@:
endif

.PHONY: help validate \
        deploy-hosting deploy-functions deploy \
        local dev func fn app admin \
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
	@echo "admin:"
	@echo "  make admin install   Install admin dependencies (pnpm)"
	@echo "  make admin build     Build admin for production"
	@echo "  make admin lint      Lint admin"
	@echo "  make admin typecheck Type-check admin"
	@echo "  make admin test      Run admin tests"
	@echo ""
	@echo "func / fn:"
	@echo "  make func install    Install backend dependencies (npm)"
	@echo "  make func build      Compile Cloud Functions (tsc)"
	@echo "  make func lint       Lint Cloud Functions"
	@echo "  make func test       Run backend tests (Jest)"
	@echo "  make func typecheck  Type-check backend"
	@echo ""
	@echo "local:"
	@echo "  make local up        Start Firebase emulators (builds backend first)"
	@echo "  make local down      Stop Firebase emulators (kill ports)"
	@echo "  make local restart   Stop + rebuild + start emulators"
	@echo "  make local app       Vite dev server connected to emulators (port 5173)"
	@echo "  make local admin     Admin panel dev server connected to emulators (port 5174)"
	@echo "  make local set-admin foo@bar.com  Set admin:true claim (emulator)"
	@echo "  make local seed      Seed questions into local Firestore emulator"
	@echo "  make local gf        List pending flagged questions (emulator)"
	@echo "  make local rf        Resolve a flagged question (emulator)"
	@echo ""
	@echo "dev:"
	@echo "  make dev app         Vite dev server connected to real Firebase (port 5173)"
	@echo "  make dev admin       Admin panel dev server connected to real Firebase (port 5174)"
	@echo "  make dev set-admin foo@bar.com  Set admin:true claim (prod)"
	@echo "  make dev seed        Seed questions into real Firestore (prod)"
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
		install)   pnpm --prefix app install --frozen-lockfile ;; \
		build)     pnpm --prefix app build ;; \
		lint)      pnpm --prefix app lint ;; \
		typecheck) pnpm --prefix app typecheck ;; \
		test)      pnpm --prefix app test ;; \
		*) echo "Unknown: make app [install|build|lint|typecheck|test]"; exit 1 ;; \
	esac

# ── admin namespace ───────────────────────────────────────────────────────────
admin:
	@if [ "$(firstword $(MAKECMDGOALS))" != "admin" ]; then exit 0; fi; \
	case "$(word 2,$(MAKECMDGOALS))" in \
		install)   pnpm --prefix admin install --frozen-lockfile ;; \
		build)     pnpm --prefix admin build ;; \
		lint)      pnpm --prefix admin lint ;; \
		typecheck) pnpm --prefix admin typecheck ;; \
		test)      pnpm --prefix admin test ;; \
		*) echo "Unknown: make admin [install|build|lint|typecheck|test]"; exit 1 ;; \
	esac

# ── func namespace (alias: fn) ────────────────────────────────────────────────
func fn:
	@if [ "$(firstword $(MAKECMDGOALS))" != "func" ] && [ "$(firstword $(MAKECMDGOALS))" != "fn" ]; then exit 0; fi; \
	case "$(word 2,$(MAKECMDGOALS))" in \
		install)   cd backend && npm install ;; \
		build)     cd backend && npm run build ;; \
		lint)      cd backend && npm run lint ;; \
		typecheck) cd backend && npx tsc --noEmit ;; \
		test)      cd backend && npm test ;; \
		*) echo "Unknown: make func [install|build|lint|typecheck|test]"; exit 1 ;; \
	esac

# ── local namespace ───────────────────────────────────────────────────────────
local:
	@case "$(word 2,$(MAKECMDGOALS))" in \
		up) \
			cd backend && npm run build && cd .. && \
			firebase emulators:start --only auth,functions,firestore,storage ;; \
		down) \
			lsof -ti :4000,9099,8080,9199,4400,4500,5001 | xargs kill -9 2>/dev/null; \
			echo "Emulators stopped." ;; \
		restart) \
			lsof -ti :4000,9099,8080,9199,4400,4500,5001 | xargs kill -9 2>/dev/null; \
			cd backend && npm run build && cd .. && \
			firebase emulators:start --only auth,functions,firestore,storage ;; \
		app) \
			VITE_USE_EMULATOR=true pnpm --prefix app dev ;; \
		admin) \
			VITE_USE_EMULATOR=true pnpm --prefix admin dev ;; \
		set-admin) \
			FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIREBASE_PROJECT_ID=poscomp-olivmath GOOGLE_CLOUD_PROJECT=poscomp-olivmath \
			npx tsx backend/src/scripts/set-admin.ts "$(word 3,$(MAKECMDGOALS))" ;; \
		seed) \
			FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath \
			cd scripts && ./node_modules/.bin/tsx seed.ts ;; \
		get-flagged|gf) \
			FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath \
			npx tsx backend/src/scripts/get-flagged.ts ;; \
		resolve-flagged|rf) \
			read -p "Enter flag ID to resolve: " id; \
			FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=poscomp-olivmath \
			npx tsx backend/src/scripts/resolve-flagged.ts "$$id" ;; \
		*) echo "Unknown: make local [up|down|restart|app|admin|set-admin|seed|gf|rf]"; exit 1 ;; \
	esac

# ── dev namespace (prod) ──────────────────────────────────────────────────────
dev:
	@if [ "$(firstword $(MAKECMDGOALS))" != "dev" ]; then exit 0; fi; \
	case "$(word 2,$(MAKECMDGOALS))" in \
		app) \
			pnpm --prefix app dev ;; \
		admin) \
			pnpm --prefix admin dev ;; \
		set-admin) \
			FIREBASE_PROJECT_ID=poscomp-olivmath GOOGLE_CLOUD_PROJECT=poscomp-olivmath \
			npx tsx backend/src/scripts/set-admin.ts "$(word 3,$(MAKECMDGOALS))" ;; \
		seed) \
			FIREBASE_PROJECT_ID=poscomp-olivmath \
			cd scripts && ./node_modules/.bin/tsx seed.ts ;; \
		deploy) \
			case "$(word 3,$(MAKECMDGOALS))" in \
				app)   pnpm --prefix app build && firebase deploy --only hosting:app ;; \
				admin) pnpm --prefix admin build && firebase deploy --only hosting:admin ;; \
				func)  cd backend && npm run build && cd .. && firebase deploy --only functions ;; \
				*) echo "Unknown: make dev deploy [app|admin|func]"; exit 1 ;; \
			esac ;; \
		*) echo "Unknown: make dev [app|admin|set-admin|seed|deploy]"; exit 1 ;; \
	esac

# ── Validate (full pipeline) ──────────────────────────────────────────────────
validate:
	$(MAKE) app install
	$(MAKE) func install
	$(MAKE) admin install
	$(MAKE) app lint && $(MAKE) app typecheck
	$(MAKE) admin lint && $(MAKE) admin typecheck
	$(MAKE) func lint && $(MAKE) func typecheck
	$(MAKE) app test
	$(MAKE) func test
	$(MAKE) app build
	$(MAKE) admin build
	$(MAKE) func build
