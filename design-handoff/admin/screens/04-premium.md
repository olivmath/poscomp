# Admin — Tela: Solicitações Premium

## Layout

```
┌──────────────────────────────────────────────────────┐
│ [filtro: pending / approved / denied]                │
├──────────────────────────────────────────────────────┤
│ UID         | Plano    | Data       | Status  | Ação │
│ uid_abc...  | Pro      | 02/06/26   | PENDING | [...] │
│ uid_xyz...  | Pro MAX  | 01/06/26   | APPROVED| —    │
└──────────────────────────────────────────────────────┘
```

## Expansão do ticket (clicar na linha)

```
┌──────────────────────────────────────────────────────┐
│ UID: uid_abc123                                      │
│ Plano: Pro (R$10/mês — 30 dias)                     │
│ Enviado em: 02/06/2026 14:32                        │
│                                                      │
│ [visualizar comprovante]  (abre Signed URL em nova aba) │
│ Tipo: image/jpeg                                    │
│                                                      │
│ [Aprovar]                              [Negar]      │
└──────────────────────────────────────────────────────┘
```

## Ações

| Ação    | Function backend                            | Efeito                                                    |
|---------|---------------------------------------------|-----------------------------------------------------------|
| Aprovar | `reviewPremiumRequest({ action: 'approve' })` | Ativa premium + push notification ao usuário            |
| Negar   | `reviewPremiumRequest({ action: 'deny' })`  | Apenas marca como negado, não altera o usuário            |

- Ambas as ações só funcionam se o ticket estiver `pending` — `failed-precondition` caso contrário
- Após aprovação/negação: ticket some da fila `pending` e vai para o histórico

## Badge no menu lateral

- Número de tickets com `status = 'pending'`
- Some quando `count = 0`

## SLA

A ativação ocorre em até **1h** após aprovação (conforme mensagem exibida ao usuário no app).
