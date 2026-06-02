# Tela — Perfil (`/perfil`)

## Layout completo

```
┌─────────────────────────────┐
│                             │
│    [foto do Google]  ou     │
│    [ícone person]           │
│    Nome do usuário          │
│    email@gmail.com          │
│                             │
│  ─── Assinatura ────────── │
│  [premium icon] Plano Pro   │
│                 Renova em 01/07
│                         [Ver planos] (só Free)
│                             │
│  ─── Preferências ──────── │
│  [dark_mode]  Tema escuro    │  [switch]
│  [notifications] Notificações│  [switch]
│                             │
│  ─── Sobre ─────────────── │
│  [info]   Versão     v4.6.2 │
│  [policy] Política privac. ›│
│  [gavel]  Termos de uso   ›│
│                             │
│  ─── Conta ─────────────── │
│  [logout] Sair da conta     │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚠️  Cuidado             │ │
│ │  Remove permanentemente  │ │
│ │  todos os dados.         │ │
│ │ [Apagar todos os dados]  │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│  Home  Revisão  Hist  Perfil│
└─────────────────────────────┘
```

## Seção Assinatura — estados

| Estado                | Exibição                                      |
|-----------------------|-----------------------------------------------|
| Free                  | "Plano Free" + botão "Ver planos"             |
| Pending               | "Aguardando aprovação" (sem botão)            |
| Pro                   | "Plano Pro" + data de renovação               |
| Pro MAX               | "Plano Pro MAX" + data de renovação           |
| profileLoading        | "..." (placeholder enquanto carrega)          |

## Preferências

| Item          | Estado inicial    | Ação                            |
|---------------|-------------------|---------------------------------|
| Tema escuro   | persiste no storage | toggle light/dark               |
| Notificações  | permissão do browser | toggle FCM push notifications  |

### Notificações — estados do switch

| notifPermission  | Switch habilitado | Supporting text         |
|------------------|-------------------|-------------------------|
| default/granted  | Sim               | —                       |
| denied           | Não               | "Bloqueado no navegador"|
| unsupported      | Não               | "Não suportado"         |

## Danger Zone

- Background vermelho suave / cor de erro
- Botão outlined vermelho: "Apagar todos os dados"
- Abre ModalOverlay de confirmação:
  - "Apagar tudo?" → descrição do impacto
  - "Cancelar" (text button) | "Apagar tudo" (filled, vermelho)
  - Durante deleção: botões desabilitados, backdrop locked

## Modais do Perfil

| Modal            | Trigger                | Conteúdo                    |
|------------------|------------------------|-----------------------------|
| PremiumFlowModal | "Ver planos"           | Fluxo de compra 5 steps     |
| LegalModal       | "Política..." ou "Termos..." | Texto legal em modal  |
| ModalOverlay     | "Apagar dados"         | Confirmação de deleção      |
