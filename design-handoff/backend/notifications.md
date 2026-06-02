# Notificações Push — FCM + Cloud Scheduler

## Visão geral

Push notifications via **Firebase Cloud Messaging (FCM)**. Três jobs agendados + 1 trigger de evento.

---

## Infraestrutura

- **FCM tokens** armazenados em `users/{uid}.fcmTokens: string[]` — array suporta múltiplos devices por usuário
- **Opt-in**: `users/{uid}.notificationsEnabled: boolean`
- **Auto-limpeza**: tokens inválidos (`registration-token-not-registered`, `invalid-registration-token`) são removidos automaticamente do array após cada envio falho

---

## Jobs agendados

### 1. `sendReviewReminder` — Revisão pendente

| Parâmetro | Valor                    |
|-----------|--------------------------|
| Schedule  | `0 12 * * *` (UTC)       |
| Horário   | 9h00 BRT (diário)        |
| Timezone  | America/Sao_Paulo        |

**Lógica**:
1. Busca todos os usuários com `notificationsEnabled = true` e `fcmTokens.length > 0`
2. Para cada usuário: verifica se há `srs_cards` com `dueDate <= now`
3. Se sim: conta o total e envia notificação

**Payload**:
```
title: "Hora de revisar!"
body:  "Você tem N card(s) para revisar hoje."
url:   "/revisao"
```

---

### 2. `sendStreakReminder` — Streak em risco

| Parâmetro | Valor                    |
|-----------|--------------------------|
| Schedule  | `0 0 * * *` (UTC)        |
| Horário   | 21h00 BRT (diário)       |
| Timezone  | America/Sao_Paulo        |

**Lógica**:
1. Calcula cutoff = `now - 24h`
2. Busca usuários com `notificationsEnabled = true` E `lastActivity <= cutoff`
3. Envia para cada um

**Payload**:
```
title: "Não quebre seu ritmo!"
body:  "Você não estudou hoje. Reserve 5 minutos para revisão."
url:   "/revisao"
```

---

### 3. `sendWeeklySimuladoReminder` — Lembrete semanal

| Parâmetro | Valor                    |
|-----------|--------------------------|
| Schedule  | `0 12 * * 1` (UTC)       |
| Horário   | 9h00 BRT toda segunda    |
| Timezone  | America/Sao_Paulo        |

**Lógica**: envia para todos os usuários com `notificationsEnabled = true` sem filtro adicional.

**Payload**:
```
title: "Simulado semanal"
body:  "Que tal testar seus conhecimentos com um simulado esta semana?"
url:   "/"
```

---

## Trigger de evento: `notifyPremiumApproved`

Não é um job agendado — é um helper chamado internamente por `reviewPremiumRequest` após aprovar um ticket.

**Payload**:
```
title: "Premium ativado!"
body:  "Sua assinatura foi aprovada. Aproveite o acesso completo ao POSCOMP App."
url:   "/perfil"
```

**Modo de falha**: fire-and-forget com `catch` que apenas loga warning — a aprovação do premium não é bloqueada se a notificação falhar.

---

## Estrutura da mensagem FCM (Web Push)

```typescript
{
  tokens: string[],                  // multicast para múltiplos devices
  notification: {
    title: string,
    body: string
  },
  webpush: {
    fcmOptions: { link: url },
    notification: {
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [200, 100, 200]
    }
  },
  data: { url: string }              // disponível no service worker
}
```

---

## Gerenciamento de tokens

O app usa `sendEachForMulticast` que retorna o resultado de cada token individualmente.
Tokens com erro `messaging/registration-token-not-registered` ou `messaging/invalid-registration-token` são removidos via `FieldValue.arrayRemove` do array `fcmTokens`.

---

## Tech debt: opt-in no cliente

A lógica de solicitar permissão e registrar o FCM token está no hook `useNotifications` no frontend. O token é salvo diretamente no Firestore pelo cliente (write direto, não via Cloud Function). Isso funciona porque as regras Firestore permitem ao dono escrever em `users/{uid}/*`. Porém, não há validação do formato do token antes de salvar.
