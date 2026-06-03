# Fluxo 5 — Compra Premium (Modal 5 steps)

Acionado por: "Ver planos" no Perfil, ou paywall em Revisão/Histórico.

```
[PremiumFlowModal]
    │
   ├── Step 1: Escolha do plano
    │    ├── Card Pro     (R$10/mês) — Revisão + Histórico
    │    ├── Card Pro MAX (R$5/mês)  — Idem, cobrança anual
    │    └── "Continuar" (desabilitado até selecionar)
    │               │
    │              ▼
    ├── Step 2: Detalhes do plano
    │    ├── Lista de benefícios (SM-2, priorização, histórico)
    │    ├── Preço destacado
    │    └── "Continuar"
    │               │
    │              ▼
    ├── Step 3: Pagamento PIX
    │    ├── QR Code (200×200, gerado via api.qrserver.com)
    │    ├── Campo read-only com a chave PIX
    │    ├── Botão "Copiar" (feedback: "Copiado" por 2s)
    │    └── "Pagamento enviado"
    │               │
    │              ▼
    ├── Step 4: Upload do comprovante
    │    ├── Aceita: imagem (JPG/PNG) ou PDF
    │    ├── Estado uploading: spinner + "Enviando..."
    │    ├── Estado error: mensagem + "Tentar novamente"
    │    └── "Selecionar arquivo" (dispara input[type=file] oculto)
    │               │
    │    upload OK ─► callSubmitPremiumRequest()
    │               │
    │              ▼
    └── Step 5: Confirmação
          ├── Ícone check_circle (verde)
          ├── "Estamos liberando seu acesso!"
          ├── "Em até 24h seu acesso será ativado."
          └── "Fechar" ──► reset (volta ao step 1) + fecha modal
```

## Regras de UX do modal

- Backdrop click fecha o modal (exceto durante upload)
- Fechar em qualquer step reseta para step 1
- Step 4: durante upload, backdrop e botão fechar ficam desabilitados
- Step 5: única forma de sair é o botão "Fechar"
