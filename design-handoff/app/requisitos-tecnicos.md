# Requisitos Técnicos — App (Frontend)

Exigências não-negociáveis de arquitetura, UX e implementação para o frontend.

---

## Roteamento

- O fluxo do simulado deve usar sub-rotas dedicadas: `/simulado/config`, `/simulado/running`, `/simulado/resultado`
- O botão "Começar Simulado" em telas sem rota própria (ex: Histórico vazio) deve navegar para `/` com `{ state: { action: 'openSimuladoConfig' } }` — nunca para uma rota inexistente
- Toda rota protegida sem usuário autenticado redireciona para `/login`

---

## Arquitetura de componentes

- O `PaywallCard` deve ser um componente único e reutilizável: `<PaywallCard title description ctaLabel onCta />` — usado em Revisão, Histórico e HistoricoDetalhe
- O `RelatorioFinal` deve usar `variant: 'post-simulado' | 'historico-detalhe'` para controlar quais ações exibe — sem props `onHistory?` / `onReview?` / `onBack?` soltas
- O componente de análise da Home deve se chamar `AnalysisPanel` (ou `PerformancePanel`) — não `AnalysisCarousel` (o nome deve descrever o que o componente faz)

---

## Estilização

- Nenhum token CSS deve ser hardcodado inline (ex: `style={{ '--md-icon-size': '...' }}`)
- Variantes destrutivas (botão vermelho de deletar) devem usar classe semântica `.btn-danger`
- Todos os tokens de cor, tipografia e espaçamento seguem MD3 — ver `design-system.md`

---

## Estados de carregamento

- Toda tela com conteúdo assíncrono deve ter skeleton screen — não spinner isolado
- Componentes que requerem skeleton: WeekHeader, AnalysisPanel, ResultCard, flashcard da Revisão

---

## Billing / PIX

- A chave PIX **não deve** estar no bundle do cliente — é fornecida pela function `getPixConfig`
- O upload do comprovante deve usar `uploadBytesResumable` com timeout configurado via SDK — sem `Promise.race` manual

---

## Notificações e dismiss

- IDs de slides do carousel de announcements dispensados pelo usuário devem ser persistidos em `localStorage` — o dismiss não reaparece após reload
- O FCM token deve ser registrado via Cloud Function `registerFcmToken` — não por write direto no Firestore

---

## UX / Consistência

- O CTA do paywall deve usar sempre o label "Ver planos" em todas as telas
- Comentários no código devem explicar apenas o **porquê** de decisões não óbvias — sem comentários que descrevem o que o código faz

---

## Funcionalidades obrigatórias

| Funcionalidade                    | Onde                        | Prioridade |
|-----------------------------------|-----------------------------|------------|
| Notificação push de revisão       | `useNotifications`          | Alta       |
| Onboarding / tutorial             | Login → Home                | Alta       |
| Animação de transição entre telas | Global                      | Média      |
| Infinite scroll no Histórico      | `/historico`                | Média      |
| Compartilhar resultado            | RelatorioFinal              | Média      |
| Pull-to-refresh no Histórico      | `/historico`                | Baixa      |
| Modo offline (PWA)                | Global                      | Média      |
