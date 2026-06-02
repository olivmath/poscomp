# POSCOMP App — Design Handoff

App de preparação para o POSCOMP (Programa de Pós-Graduação em Ciência da Computação).
Mobile-first PWA. Stack atual: React + Firebase + Material Web Components (MD3).

---

## Estrutura deste pacote

```
design-handoff/
  README.md              ← este arquivo
  design-system.md       ← cores, tipografia, espaçamentos, componentes base
  tech-debt.md           ← o que está ruim no código atual e precisa refatorar
  flows/                 ← jornadas de usuário (fluxogramas)
  screens/               ← spec de cada tela (layout, estados, ações)
  components/            ← componentes compartilhados
```

---

## Rotas do app

| Rota              | Componente         | Acesso       |
|-------------------|--------------------|--------------|
| `/login`          | Login              | Público      |
| `/`               | Home (multi-state) | Autenticado  |
| `/revisao`        | Revisao            | Premium      |
| `/historico`      | Historico          | Premium      |
| `/historico/:id`  | HistoricoDetalhe   | Premium      |
| `/perfil`         | Perfil             | Autenticado  |

---

## Navegação principal

Bottom navigation bar com 4 tabs:
- **Home** (`/`) — ícone `home`
- **Revisão** (`/revisao`) — ícone `article` + badge com nº de cards pendentes
- **Histórico** (`/historico`) — ícone `history`
- **Perfil** (`/perfil`) — ícone `person`

A barra some completamente no modo imersivo (simulado em andamento).

---

## Planos / Billing

| Plano    | Preço        | Recursos desbloqueados              |
|----------|-------------|-------------------------------------|
| Free     | R$0          | Simulado ilimitado                  |
| Pro      | R$10/mês     | + Revisão espaçada + Histórico      |
| Pro MAX  | R$5/mês      | Idem Pro, cobrança anual (R$60/ano) |

Pagamento manual via PIX — usuário envia comprovante, admin aprova em até 24h.

---

## Contextos / Estado global

| Contexto            | O que provê                                    |
|---------------------|------------------------------------------------|
| `AuthContext`       | user, isPremium, planType, premiumStatus       |
| `SrsContext`        | SRS cards do Firestore (evita double read)     |
| `ImmersiveModeContext` | flag `isImmersive` (esconde bottom nav)    |
| `SnackbarProvider`  | toasts globais                                 |
