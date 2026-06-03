# Tech Debt — O que precisa ser corrigido

Lista de problemas identificados no código atual para o dev frontend endereçar.

---

##  Crítico (quebra funcionalidade)

### 1. Rota `/simulado` não existe
**Onde**: `Historico.tsx:129` — `navigate('/simulado')`
**Problema**: O estado "empty" do Histórico tem um botão "Começar Simulado" que navega para `/simulado`, mas essa rota não existe no roteador. O usuário seria redirecionado para `/` (catch-all), mas sem abrir a config do simulado.
**Fix**: Mudar para `navigate('/', { state: { action: 'openSimuladoConfig' } })` — igual ao que a Revisão já faz corretamente.

---

##  Importante (UX / manutenibilidade)

### 2. Machine de estados do simulado acoplada ao Home
**Onde**: `pages/Home.tsx` — 4 estados inline (idle/config/running/finished)
**Problema**: A página Home.tsx renderiza 4 telas completamente diferentes baseado em `state`. Isso mistura responsabilidades, dificulta testes e o fluxo não é evidente para quem lê o código.
**Fix**: Extrair ConfigScreen, RunningScreen e RelatorioFinal para sub-rotas ou componentes lazy com router state. Sugestão de rotas: `/simulado/config`, `/simulado/running`, `/simulado/resultado`.

### 3. Estilos inline no Perfil (hardcode de CSS tokens)
**Onde**: `pages/Perfil.tsx:69, 211, 228, 235`
**Problema**: Uso de `style={{ '--md-icon-size': '...' }}` e `style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}` hardcodados inline.
**Fix**: Criar classes CSS semânticas (`.perfil-icon-xl`, `.btn-danger`) ou usar componentes customizados.

### 4. Comentários em português no código de produção
**Onde**: Múltiplos arquivos — `Home.tsx:48`, `RunningScreen.tsx:163`, etc.
**Problema**: Comentários explicando "o quê" em vez de "por quê", misturados no código.
**Fix**: Remover comentários óbvios, manter apenas os que explicam invariantes não óbvias.

### 5. Duplicação do componente Paywall
**Onde**: `Revisao.tsx:54-69`, `Historico.tsx:87-100`, `HistoricoDetalhe.tsx:75-86`
**Problema**: O bloco de paywall (lock icon + título + descrição + botão) está duplicado 3 vezes com pequenas variações de texto.
**Fix**: Extrair `<PaywallCard title="" description="" ctaLabel="" onCta={} />`.

### 6. Botão "Ver planos" vs "Assinar Agora"
**Onde**: `Historico.tsx:94` vs `HistoricoDetalhe.tsx:80`
**Problema**: Dois textos diferentes para a mesma ação em telas quase idênticas. Inconsistência de UX.
**Fix**: Padronizar o label. Sugestão: "Ver planos" (menos pressão).

---

##  Melhoria (qualidade / escalabilidade)

### 7. RelatorioFinal recebe props variáveis para esconder/mostrar botões
**Onde**: `RelatorioFinal.tsx:117-122`
**Problema**: Props opcionais `onHistory?`, `onReview?`, `onBack?` controlam quais botões aparecem. Isso implica lógica de apresentação via props booleanas/undefined.
**Fix**: Usar um slot/children ou um enum de `variant: 'post-simulado' | 'historico-detalhe'`.

### 8. PIX key e URL do QR hardcodados
**Onde**: `PremiumFlowModal.tsx:12-14`
**Problema**: `PIX_KEY = 'poscomp@app.com'` e a URL do gerador de QR estão hardcodados no bundle do cliente.
**Fix**: Mover para variáveis de ambiente (`VITE_PIX_KEY`). A URL do QR server vai junto.

### 9. Timeout manual de 20s no upload de comprovante
**Onde**: `PremiumFlowModal.tsx:62-65`
**Problema**: `Promise.race` com setTimeout manual para simular timeout. Firebase SDK já tem timeout configurável.
**Fix**: Usar `uploadBytesResumable` com controle nativo ou configurar o timeout no Firebase SDK.

### 10. Ausência de skeleton screens
**Onde**: Todos os estados de loading usam spinner simples.
**Problema**: Experiência de loading abrupta — o conteúdo aparece de uma vez depois do spinner.
**Fix**: Implementar skeleton screens para WeekHeader, AnalysisCarousel, ResultCard, e o flashcard da Revisão.

### 11. AnnouncementBanner não tem limite de exibição
**Onde**: `components/AnnouncementBanner.tsx`
**Problema**: Sem lógica de dismiss persistente — o banner reaparece em todo reload.
**Fix**: Persistir IDs de banners dispensados no localStorage.

### 12. AnalysisCarousel não é carousel
**Nome enganoso**: O componente se chama `AnalysisCarousel` mas não implementa navegação por slides. É um painel estático com duas seções.
**Fix**: Renomear para `AnalysisPanel` ou `PerformancePanel`, ou implementar o carousel de verdade.

---

##  Missing Features (funcionalidades faltando)

| Feature                        | Onde falta              | Impacto    |
|-------------------------------|-------------------------|------------|
| Animação de transição entre telas | Geral                | Médio      |
| Pull-to-refresh no Histórico  | Historico.tsx           | Baixo      |
| Infinite scroll no Histórico  | Historico.tsx           | Médio (se banco crescer) |
| Compartilhar resultado        | RelatorioFinal          | Médio      |
| Notificação push de revisão   | useNotifications.ts     | Alto       |
| Onboarding / tutorial         | Login → Home            | Alto       |
| Estatísticas globais no Home  | Home idle               | Médio      |
| Modo offline                  | Geral (PWA)             | Médio      |
