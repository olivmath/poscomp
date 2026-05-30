# Sprint de Profissionalização — POSCOMP App

## Context

O app tem um design system MD3 sólido (`src/index.css`, ~3685 linhas de tokens) e stylelint estrito proibindo hardcoded — mas a execução visual e de UX não está à altura. O usuário relatou: contraste fraco, valores hardcoded residuais, layout não mobile-first, ausência de feedback de loading/sucesso ao esperar o backend, e inconsistências tela a tela. Existem **8 issues abertas** que cobrem boa parte disso.

**Objetivo**: fechar o gap entre "tem design system" e "parece profissional" — acessibilidade WCAG AA, zero hardcoded, mobile-first real, e feedback claro em toda interação assíncrona.

**Formato de entrega**: este documento é a sprint/backlog. Nada é executado agora — o usuário escolhe a ordem de ataque. Fases são desenhadas para virar PRs independentes (cada uma com label e CI verde).

**Decisões já tomadas** (via AskUserQuestion):
- Feedback assíncrono → `<LoadingModal>` reutilizável + Snackbar global + report inline com check
- Revisão → **manter binário Errei/Acertei** (issue #55 descartada — fechar com justificativa)
- Cores de confidence → **re-tematizar com tonal palettes MD3** (via MCP Material 3)

**Ferramentas obrigatórias na execução** (memória `feedback_ui_standards`): MCP Material 3 (`mcp__material3__*`) para tokens/acessibilidade/componentes + skill `frontend-design`. Mobile-first, tokens MD3, nunca hardcoded.

---

## Mapa: pedido do usuário × issue × fase

| Pedido do usuário | Issue | Fase |
|---|---|---|
| Cores/contraste horrível | #58 (parcial) | **F1** |
| Style lint / nada hardcoded | — | **F1** |
| Feedback de loading/sucesso, report vira check, finish loading | — | **F2** |
| Mobile-first; confidence btns fora do viewport; CTA Home oculto | #50, #57 | **F3** |
| Config: fonts erradas, forms sem hierarquia, ícones de área, fundo cinza | — | **F4** |
| Mapa de questões mal posicionado + legenda sem cor | #52 | **F4** |
| Padrão de telas / centralização inconsistente; cards fora do padrão da lib | — | **F5** |
| Revisão: botão voltar sem sentido; data SM-2; progresso | #56 | **F5** |
| Histórico feio → lista melhor; report sem voltar | — | **F5** |
| Perfil: infos duplicadas + configs faltando | — | **F5** |
| Botão "anterior" no simulado | #51 | **F3** |
| A11y: touch targets <48px, semântica, h1, alt, aria | #58 | **F6** |

Issue **#55** (4 categorias na revisão) → **fechar** como "won't do" (decisão de manter binário).

---

## F1 — Design tokens & contraste (label: `patch`)

**Por quê**: base de tudo. Sem cores acessíveis e zero-hardcoded, o resto herda dívida.

### 1.1 Re-tematizar cores de confidence com tonal palettes MD3
- Gerar via `mcp__material3__get_design_tokens` paletas tonais para os 3 estados semânticos:
  - `unsure` (Não sei) → azul · `studying` (Estudando) → teal/cyan · `should_know` (Devia saber) → laranja/vermelho · `skipped` → âmbar
- Para cada estado definir par **container / on-container** garantido AA (4.5:1) em light **e** dark.
- Validar com `mcp__material3__get_accessibility_guidelines`.
- Substituir os tokens hardcoded em `src/index.css:130-162` (light) e variantes dark pelos novos pares.
- Aplica a: `.confidence-btn--*` (`index.css:1381-1445`), legenda do mapa (#52), badges de score, distribuição no RelatorioFinal.

### 1.2 Eliminar hardcoded residual (stylelint + auditoria)
| Local | Problema | Correção |
|---|---|---|
| `index.css:1264` | `linear-gradient(90deg, #6366f1, #8b5cf6)` em `.immersive-progress-fill` | token de gradiente novo (`--color-progress-gradient`) |
| `index.css:1537` | `z-index: 9000` em `.modal-overlay` | `var(--z-modal)` ou novo `--z-portal` |
| `index.css:1614` | `padding: 10px` em `.modal-btn` | `var(--space-sm-md)` |
| `index.css:1644` | `color: #fff` em `.modal-btn--danger` | `var(--md-sys-color-on-error)` |
| `index.css:1742` | `background: #922018` hover confirm | derivar de `var(--color-error)` |
| `index.css:2640` | descending specificity `.material-symbols-outlined` | reordenar regra |

**Aceite F1**: `pnpm lint` 100% verde (0 warnings stylelint); todos os pares de confidence ≥ 4.5:1 em light e dark (checar com MCP a11y); nenhum hex/rgba literal fora da seção de tokens `:root`/`.dark`.

---

## F2 — Sistema de feedback assíncrono (label: `minor`)

**Por quê**: hoje `finishSimulado` congela a tela sem feedback; report fecha sem confirmar; cada hook trata loading de um jeito. (Confirmado em `useSimulado.ts:98-137`, `ReportIssueModal.tsx`, `RunningScreen.tsx:122-124`.)

### 2.1 `<LoadingModal>` reutilizável
- Novo componente em `src/components/LoadingModal.tsx` usando `ModalOverlay` + `md-circular-progress` + label.
- Usar em **toda transição que espera backend**:
  - Finish simulado (`useSimulado.ts:117` — hoje sem feedback) → modal "Calculando resultado…" até `callFinishSimulado` resolver.
  - Start simulado (carregar questões), carregar revisão, carregar histórico/detalhe (unificar `.spinner` ad-hoc de `Historico.tsx:53` e `HistoricoDetalhe.tsx:64`).

### 2.2 Snackbar / Toast global
- Novo `SnackbarProvider` (context) + `useSnackbar()` montado em `main.tsx` junto aos outros providers.
- Sucesso/erro para: report enviado, reviewCard salvo, delete de dados, erros de rede (hoje silenciosos em `useSrs.ts:24`, `useRevisao.ts:39`).
- Componente visual: `md-*` style / tokens MD3, bottom acima do nav, com `aria-live="polite"`.

### 2.3 Report problema → check inline + envio em background
- `ReportIssueModal.tsx`: ao confirmar, o **modal inteiro vira estado de sucesso** (ícone check + "Problema enviado para o suporte"), fecha sozinho após ~1.2s.
- Envio em **background** (não bloqueia o usuário); hoje o comentário só é anexado à resposta em `useSimulado.ts:229-237` — manter, mas disparar persistência/sinal imediato + snackbar de confirmação.

**Aceite F2**: nenhuma interação que chama backend fica sem feedback visual; report mostra confirmação antes de fechar; loading modal aparece no finish; padrão único de loading reutilizado em ≥4 telas.

---

## F3 — Mobile-first crítico (label: `patch`/`minor`)

**Por quê**: ações essenciais fora do viewport em telas pequenas.

| Item | Issue | Arquivo | Correção |
|---|---|---|---|
| Confidence btns fora do viewport + overflow horizontal | **#50** | `RunningScreen.tsx`, `.confidence-buttons` (`index.css:1331`) | sticky footer fixo acima do nav; `flex-wrap`/reduzir padding p/ caber em 375px |
| CTA "Iniciar Simulado" oculto abaixo da dobra (estado vazio) | **#57** | `Home.tsx` | CTA proeminente no topo quando `state==='empty'` ou sticky bottom |
| Botão "← Anterior" no simulado | **#51** | `RunningScreen.tsx` + `useSimulado.goToQuestion` | botão no header, desabilitado na Q1, restaura seleção sem permitir reclassificar confiança já enviada |

**Aceite F3**: em viewport 375×667 (iPhone SE) todas as ações principais (opções, confiança, anterior, CTA) visíveis e tocáveis sem scroll forçado; nenhum overflow horizontal. Verificar via Playwright MCP.

---

## F4 — Tela de configuração do simulado (label: `minor`)

**Por quê**: forms sem hierarquia/ordem, fonts erradas, fundo "cinza estranho", áreas sem ícone. (`ConfigScreen.tsx`.)

- **Hierarquia/ordem**: reestruturar como steps lógicos — (1) Temas/áreas → (2) Nº de questões → (3) Tempo. Títulos `type-title-*` consistentes, labels com peso/tamanho corrigidos (hoje `.config-label` = label-large; revisar contra type scale).
- **Fundo cinza**: investigar via Playwright — hipótese é o `.simulado-card` (`surface-container-high`) sobre o gradient parecendo cinza chapado. Ajustar surface/elevação ou remover o container intermediário.
- **Ícones de área**: usar `src/utils/areaIcons.ts` (`AREA_ICONS`, já usado no RelatorioFinal) nas chips de área da config — e como fallback quando o nome não couber. Avaliar buscar ícones via `mcp__material3__search_material_icons`.
- **Componentes da lib**: chips hoje são `md-filter-chip` sem ícone → adicionar leading-icon; garantir tokens de fonte corretos.
- **Mapa de questões (#52)**: centralizar modal (`.modal-card--map`) e dar **cor de fundo por status** em cada célula do grid (reusar tokens de confidence da F1). Arquivo `QuestionMapModal.tsx`.

**Aceite F4**: config com hierarquia visual clara (3 grupos ordenados), sem superfície cinza espúria, áreas com ícone, fontes alinhadas ao type scale; mapa centralizado e colorido por status.

---

## F5 — Consistência de telas (label: `minor`)

**Por quê**: cada tela centraliza diferente; telas "faltando coisa"; cards fora do padrão; navegação confusa.

### 5.1 Padrão de layout unificado
- Definir regra clara: telas-dashboard (Home, Histórico, Perfil) usam `.page-shell` (scroll do topo); telas-foco (Login, Config, idle/finished) usam container centralizado. Documentar e alinhar.
- **Home** "parece faltar coisa embaixo" — revisar `.page-shell` padding-bottom + sticky CTA (liga com #57).

### 5.2 Revisão (#56) — manter binário, corrigir resto
- **Remover/repensar** o botão voltar sem sentido em modo running (`Revisao.tsx:112-114`) — substituir por saída coerente (confirmar abandono) ou remover.
- Mostrar **"Próxima revisão: em X dias"** após classificar (intervalo SM-2 calculado).
- **Barra de progresso visual** + resumo da sessão no estado finished.
- Adicionar `<h1 class="sr-only">Revisão</h1>` (liga com F6).

### 5.3 Histórico
- Melhorar `.hist-card`: infos mais ricas (área destaque, nº questões, tendência vs anterior).
- Detalhe (`HistoricoDetalhe` → `RelatorioFinal`) já tem voltar; garantir consistência do header de voltar em todos os relatórios.

### 5.4 Perfil
- Remover duplicação Nome/E-mail (header + lista `Perfil.tsx`).
- Avaliar configs adicionais: notificações/lembrete de revisão, meta diária, idioma — propor set enxuto.

### 5.5 Cards de questão — padrão da lib
- Hoje `.simulado-option`, `.revisao-flipcard`, `.question-review` são divs custom. Padronizar visualmente com tokens MD3 + `md-ripple`/elevation consistentes (não reescrever tudo em web components — manter divs mas alinhar ao padrão MD3 de surface/state-layer). Decidir caso a caso.

**Aceite F5**: regra de centralização documentada e aplicada; revisão sem botão órfão + data SM-2 + progresso; histórico com cards informativos; perfil sem duplicatas; cards de questão visualmente consistentes com o design system.

---

## F6 — Acessibilidade (#58) (label: `patch`)

**Por quê**: touch targets <48px e semântica ausente em várias telas.

| Item | Local | Correção |
|---|---|---|
| Dots carrossel 10×10 | Home/`AnalysisCarousel` | wrapper `min 48×48`, visual menor centralizado |
| Botão "Fechar mapa" 32×32 | `QuestionMapModal`/`.modal-close-btn` | área de toque ≥48px |
| Dias da semana sem role | `WeekHeader` | `role="group"` + `aria-label` por dia |
| Streak emoji 🔥 | `WeekHeader` | `aria-label`, esconder emoji de leitor |
| `<h1>` ausente | Revisão, Histórico | `<h1 class="sr-only">` |
| Avatar sem alt | Perfil | `alt={displayName ?? 'Foto de perfil'}` |
| `aria-live` revisão | `Revisao.tsx` | anunciar carga de cards |

**Aceite F6**: todos os touch targets ≥48×48 (WCAG 2.5.5); cada página com `<h1>`; imagens com alt; estados dinâmicos anunciados. Validar com `mcp__material3__get_accessibility_guidelines` + Playwright snapshot.

---

## Arquivos-chave

```
src/index.css                              # F1 tokens/cores, F3 sticky, F4 config/mapa
src/main.tsx                               # F2 SnackbarProvider
src/components/LoadingModal.tsx            # F2 (novo)
src/components/SnackbarProvider.tsx        # F2 (novo) + useSnackbar
src/components/ModalOverlay.tsx            # base portal (reuso F2)
src/components/simulado/ReportIssueModal.tsx  # F2 check inline
src/components/simulado/RunningScreen.tsx  # F3 sticky confidence + #51 anterior
src/components/simulado/QuestionMapModal.tsx  # F4 #52
src/components/simulado/ConfigScreen.tsx   # F4 hierarquia/ícones/fundo
src/hooks/useSimulado.ts                   # F2 loading finish, #51 goToQuestion
src/hooks/useRevisao.ts | useResults.ts | useSrs.ts  # F2 erros via snackbar
src/pages/Home.tsx                         # F3 #57, F5 layout
src/pages/Revisao.tsx                      # F5 #56, F6 h1
src/pages/Historico.tsx | HistoricoDetalhe.tsx  # F2 loading, F5 cards
src/pages/Perfil.tsx                       # F5 duplicatas/configs, F6 alt
src/components/home/WeekHeader.tsx | AnalysisCarousel.tsx  # F6
src/utils/areaIcons.ts                     # F4 reuso AREA_ICONS
```

## Verificação (cada fase)

1. `pnpm lint` (eslint + stylelint) **verde** — zero hardcoded.
2. `pnpm typecheck` + `pnpm test` verdes.
3. **Playwright MCP** em 375×667 e 390×844: screenshots antes/depois de cada tela tocada; checar viewport, overflow, touch targets, posição de modais. (Copiar `.env.local` para o worktree antes.)
4. **MCP Material 3**: validar pares de cor (AA) e tokens/componentes usados.
5. Abrir PR com label correta; vincular issue resolvida (`Closes #N`); fechar #55 como won't-do.

## Issues → status alvo

| Issue | Fase | Ação |
|---|---|---|
| #50 confidence fora do viewport | F3 | Closes |
| #51 botão anterior | F3 | Closes |
| #52 mapa modal/legenda | F4 | Closes |
| #55 4 categorias revisão | — | **Fechar won't-do** |
| #56 data SM-2 + progresso | F5 | Closes |
| #57 CTA Home oculto | F3 | Closes |
| #58 a11y touch/semântica | F6 | Closes |
