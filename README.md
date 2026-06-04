# POSCOMP

App de preparação para o POSCOMP (Programa de Pós-Graduação em Ciência da Computação).

Mobile-first PWA com simulados, revisão espaçada (SM-2) e painel admin.

## Stack

- **app/** — React + Vite + Material Design 3 (Web Components)
- **admin/** — React + Vite + Material Design 3
- **backend/** — Firebase Cloud Functions v2 (TypeScript)
- **Firebase** — Auth, Firestore, Storage, Hosting, FCM

## Planos

| Plano    | Preço        | Recursos                              |
|----------|-------------|---------------------------------------|
| Free     | R$0          | Simulado ilimitado                    |
| Pro      | R$10/mês     | + Revisão espaçada + Histórico (1 mês)|
| Pro MAX  | R$5/mês      | Idem Pro (cobrança anual R$60)        |

Pagamento manual via PIX — admin aprova em até 1h.

## Desenvolvimento

```bash
# Instalar dependências
make app install
make admin install
make func install

# Emuladores locais
make local up

# Dev com emuladores
make local app    # porta 5173
make local admin  # porta 5174

# Lint + typecheck
make app lint && make app typecheck
make admin lint && make admin typecheck
make func lint && make func typecheck

# Testes
make app test
make func test

# Pipeline completo
make validate
```

## Estrutura

```
poscomp/
├── app/        Frontend do usuário (React PWA)
├── admin/      Painel admin (React)
├── backend/    Cloud Functions (TypeScript)
├── infra/      Firebase rules (Firestore + Storage)
├── Makefile
├── firebase.json
├── CHANGELOG.md
└── README.md
```
