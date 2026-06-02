# Design System — POSCOMP App

## Base: Material Design 3 (MD3)

O app usa `@material/web` (Web Components oficiais do MD3).
Todos os tokens de cor, tipografia e espaçamento seguem o sistema MD3.

---

## Tokens de cor (CSS custom properties)

### Cores do sistema (MD3)
```css
--md-sys-color-primary               /* ação principal, links */
--md-sys-color-primary-container     /* fundo de elementos primários */
--md-sys-color-on-primary
--md-sys-color-secondary
--md-sys-color-tertiary
--md-sys-color-error                 /* danger zone, erros */
--md-sys-color-on-error
--md-sys-color-surface               /* fundo de cards */
--md-sys-color-surface-variant
--md-sys-color-surface-container
--md-sys-color-surface-container-highest
--md-sys-color-outline               /* bordas, separadores */
--md-sys-color-on-surface
--md-sys-color-on-surface-variant
```

### Tokens customizados do app
```css
--color-score-high      /* verde — ≥70% acerto */
--color-score-high-bg
--color-score-mid       /* amarelo — 50-69% */
--color-score-mid-bg
--color-score-low       /* vermelho — <50% */
--color-score-low-bg
--color-divider         /* linhas de separação em gráficos */
--color-card-bg         /* fundo base de cards */
```

---

## Temas

O app suporta **light** e **dark** mode (toggle no Perfil).
Persiste via `useTheme` (localStorage).
Implica dois conjuntos de tokens MD3.

---

## Tipografia

Segue a escala MD3:
- `display-large / medium / small`
- `headline-large / medium / small`
- `title-large / medium / small`
- `body-large / medium / small`
- `label-large / medium / small`

Classes CSS aplicadas no app (padrão MD3):
```css
.type-display-large
.type-headline-medium
.type-title-large
.type-body-medium
.type-label-medium
```

---

## Ícones

Library: **Material Symbols Outlined** (Google Fonts)
Uso: `<span class="material-symbols-outlined">icon_name</span>`

Ícones usados no app:

| Contexto          | Ícone                  |
|-------------------|------------------------|
| Nav: Home         | `home`                 |
| Nav: Revisão      | `article`              |
| Nav: Histórico    | `history`              |
| Nav: Perfil       | `person`               |
| Streak            | `local_fire_department`|
| Timer             | `timer`                |
| Sair              | `close`                |
| Mapa              | `map` / grid           |
| Pular             | `skip_next`            |
| Anterior          | `chevron_left`         |
| Reportar          | `outlined_flag` / `flag` |
| Confiança: Não sei| `help_outline`         |
| Confiança: Estudando | `school`            |
| Confiança: Devia saber | `warning`         |
| Premium           | `workspace_premium`    |
| Paywall           | `lock`                 |
| Sucesso           | `check_circle`         |
| Vazio - Revisão   | `celebration`          |
| Concluído         | `check_circle`         |
| Avançar           | `arrow_forward`        |
| Tema escuro       | `dark_mode`            |
| Tema claro        | `light_mode`           |
| Notificações ativo| `notifications_active` |
| Notificações off  | `notifications_off`    |
| Logout            | `logout`               |
| Apagar            | `delete_forever`       |
| Warning           | `warning`              |
| Info              | `info`                 |
| Privacidade       | `policy`               |
| Termos            | `gavel`                |
| Upload            | `upload`               |
| Copiar            | `content_copy`         |
| Copiado           | `check`                |
| Erro              | `error`                |
| Próxima revisão   | `schedule`             |
| Matemática (área) | `calculate` ou similar |
| Computação (área) | `memory` / `code`      |

---

## Componentes MD3 usados

| Web Component             | Uso                                 |
|---------------------------|-------------------------------------|
| `md-filled-button`        | ações primárias                     |
| `md-outlined-button`      | ações secundárias                   |
| `md-text-button`          | ações terciárias / cancel           |
| `md-navigation-bar`       | BottomNav                           |
| `md-navigation-tab`       | cada tab do BottomNav               |
| `md-list`                 | listas no Perfil                    |
| `md-list-item`            | item de lista no Perfil             |
| `md-switch`               | toggles de preferência              |
| `md-icon`                 | ícones inline                       |
| `md-circular-progress`    | spinners de loading                 |

---

## Espaçamento (MD3)

```
4px  — xs
8px  — sm
12px — md (uso frequente em padding interno)
16px — lg (padding padrão de seção)
24px — xl
32px — 2xl
```

---

## Breakpoints

App mobile-first. Não há breakpoints documentados no código — assume-se 100% width até ~480px, depois centralizado com max-width.

---

## Classes utilitárias do app

```css
.sr-only           /* visível apenas para screen readers */
.page-shell        /* wrapper de página com padding padrão */
.section-stack     /* stack vertical com gap */
.page-placeholder  /* estado vazio/erro centralizado */
.btn-full          /* botão 100% de largura */
.btn-primary       /* alias para filled */
.btn-secondary     /* alias para outlined */
.simulado-error    /* mensagem de erro inline */
```
