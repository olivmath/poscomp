# POSCOMP Study App 

App de treino para o POSCOMP (exame nacional de computação) baseado na metodologia de provas reais como simulado, inspirado na abordagem da professora e auditora **Karine Waldrich**.

---

## Filosofia do App

> "O concurso não vai cobrar sua tabela de revisão preenchida. Vai cobrar percentual de acertos na prova."
> — Karine Waldrich

### Separação de responsabilidades

| Módulo | Função |
|---|---|
| **Simulado** | Trazer questões **novas** → descobrir gaps |
| **Revisão** | Trabalhar questões **já vistas** → fechar gaps |

```
Simulado → descobre o que não sabe → cria cards SRS
Revisão  → trabalha o que não sabe → consome cards SRS
```

---

## Metodologia — Os 3 Tipos de Erro (Karine Waldrich)

Ao errar uma questão num simulado, o erro se enquadra em um dos 3 tipos:

| Tipo | Situação | Ação |
|---|---|---|
| **Tipo 1** | Matéria que **nunca estudou** | Só lê o gabarito. Passa adiante. |
| **Tipo 2** | Matéria em estudo, mas capítulo ainda não chegou | Só lê o gabarito. Passa adiante. |
| **Tipo 3** | Conteúdo que **já estudou** e mesmo assim errou | Investiga o erro. **Foco total.** |

No app, o usuário classifica cada card durante a revisão com dois botões: **"Não estudei"** / **"Estudei"**.

---

## Sistema de Revisão Espaçada (SRS)

### Algoritmo: SM-2

O app usa o algoritmo **SM-2 (SuperMemo 2)** para agendar revisões no momento certo, baseado na curva do esquecimento de Ebbinghaus.

```
Retenção
 100% ─┐  ← você estuda
       │╲
       │ ╲___
  70%  │     ╲──── revisão 1 → intervalo: 1 dia
       │          ╲_______
  70%  │                  ╲── revisão 2 → intervalo: 6 dias
       │                          ╲____________
  70%  │                                       ╲── revisão 3 → ~13 dias
       └──────────────────────────────────────────▶ tempo
```

Cada `SrsCard` tem:

| Campo | Descrição |
|---|---|
| `easeFactor` | Quão fácil o card é (começa em 2.5) |
| `interval` | Dias até a próxima revisão |
| `repetitions` | Revisões bem-sucedidas consecutivas |
| `dueDate` | Data da próxima revisão |
| `studied` | Usuário já estudou esse conteúdo? |
| `simuladoCorrect` | Foi acertado no simulado original? |

### Contraste: SM-2 clássico vs Karine vs App

| | SM-2 clássico | Karine | App (proposta) |
|---|---|---|---|
| **O que revisar** | Tudo que errou | Só o que já estudou | Tudo entra, "estudei" tem prioridade |
| **Quando revisar** | Algoritmo decide | Após cada prova, manual | Algoritmo para "estudei", fim da fila para "não estudei" |
| **Conteúdo não visto** | Revisa mesmo assim | Ignora, só lê gabarito | Vai para o fim da fila |

### Fila de revisão — Prioridade 2×2

Cards ordenados por uma matriz de prioridade com duas dimensões:

|  | Errei no simulado | Acertei no simulado |
|---|---|---|
| **Estudei** | 🔴 **P1** — Gap real, urgente | ⚪ **P4** — Domina, manutenção |
| **Não estudei** | 🟠 **P3** — Ainda não é hora | 🟡 **P2** — Acertou sem estudar? Confirmar |

#### Ordem de aparição na sessão de revisão

```
P1 → estudei   + errei      ← PRIMEIRO  (gap real — deve resolver)
P2 → não estudei + acertei  ←           (pode ser chute — confirmar)
P3 → não estudei + errei    ←           (não está pronto — ver gabarito)
P4 → estudei   + acertei    ← ÚLTIMO    (domina — só manutenção)
```

Dentro de cada grupo → SM-2 ordena por `dueDate`.

---

## Navegação

```
┌─────────────────────────────────────────────────────┐
│  🏠         ▶️        📝        📅        👤        │
│  Home    Simulado  Revisão  Histórico  Perfil        │
│                       ↑                             │
│                   badge com nº                      │
│                   de cards pendentes                │
└─────────────────────────────────────────────────────┘
```

> **Nota:** A aba **Análises** foi removida — seu conteúdo (carrossel) foi movido para a **Home**.

---

## Telas

### 🏠 Home

Dashboard principal. Agrega frequência, banner de revisão e o carrossel de análises.

```
┌─────────────────────────────────────┐
│  Olá, Lucas! 👋      █████████░░░░  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 🧠 5 questões para revisar    │  │
│  │         Revisar agora →       │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ANÁLISES  ◀ ●○○○○ ▶               │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │   [carrossel de análises]     │  │
│  │   (slides da página Análises) │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
  🏠      ▶️      📝⁵     📅      👤
```

**Regras:**
- Banner de revisão só aparece se `totalPending > 0`
- Frequência = dias consecutivos com pelo menos 1 simulado ou revisão
- Carrossel = mesmo componente atual de Análises

---

### ▶️ Simulado

Fluxo já existente. Questões **novas** (nunca vistas). Ao terminar, erros e respostas `unsure` geram `SrsCard`.

```
┌─────────────────────────────────────┐
│  [Config]  → [Questões] → [Resultado]│
│                                     │
│  Config:                            │
│  · Áreas (todas ou filtrar)         │
│  · Nº de questões (5/10/20/max)     │
│  · Timer (none / por questão)       │
│                                     │
│  Ao terminar:                       │
│  · Cria SrsCard para cada erro      │
│  · Cria SrsCard para cada "unsure"  │
│  · simuladoCorrect salvo no card    │
└─────────────────────────────────────┘
```

---

### 📝 Revisão

Sessão de flashcard. Questões **já vistas** em simulados anteriores. Ordem: P1 → P2 → P3 → P4.

#### Estado: flashcard frente

```
┌─────────────────────────────────────┐
│  ← Revisão          3 / 12  ████░░  │
│                                     │
│  🔴 P1 · Algoritmos                 │
│                                     │
│                                     │
│  Qual é a complexidade de           │
│  tempo do Merge Sort                │
│  no pior caso?                      │
│                                     │
│                                     │
│        [ Revelar gabarito ]         │
│                                     │
└─────────────────────────────────────┘
  🏠      ▶️      📝⁵     📅      👤
```

#### Estado: flashcard verso (após revelar)

```
┌─────────────────────────────────────┐
│  ← Revisão          3 / 12  ████░░  │
│                                     │
│  🔴 P1 · Algoritmos                 │
│                                     │
│  Qual é a complexidade de           │
│  tempo do Merge Sort                │
│  no pior caso?                      │
│                                     │
│  ✅ Gabarito: (B) O(n log n)        │
│  ✗  Você respondeu: (C) O(n²)       │
│                                     │
│  [ Não estudei ]    [ Estudei ]     │
└─────────────────────────────────────┘
  🏠      ▶️      📝⁵     📅      👤
```

**Botões:**
- **"Estudei"** → `studied: true` → SM-2 avança → card sobe de prioridade
- **"Não estudei"** → `studied: false` → card vai para P3/P4 → fim da fila

#### Estado: sessão concluída

```
┌─────────────────────────────────────┐
│                                     │
│        🎉 Sessão concluída!         │
│                                     │
│  12 revisadas                       │
│  ├─ 🔴 5 × Estudei + errei          │
│  ├─ 🟡 2 × Não estudei + acertei    │
│  ├─ 🟠 3 × Não estudei + errei      │
│  └─ ⚪ 2 × Estudei + acertei        │
│                                     │
│  Próxima revisão: amanhã (8 cards)  │
│                                     │
│  [ Fazer Simulado ]   [ Início ]    │
│                                     │
└─────────────────────────────────────┘
  🏠      ▶️      📝      📅      👤
```

---

### 📅 Histórico

Lista de simulados realizados. Último simulado aparece no topo.

```
┌─────────────────────────────────────┐
│  Histórico                          │
├─────────────────────────────────────┤
│  ÚLTIMO SIMULADO                    │
│  ┌───────────────────────────────┐  │
│  │ 27/05 · 12 questões · 72% ✅  │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 27/05  ·  12 questões  · 72%  │  │
│  │ Algoritmos ██░  Mat █░  ...   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 24/05  ·  10 questões  · 60%  │  │
│  │ Algoritmos █░░  Mat ██  ...   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 20/05  ·  20 questões  · 55%  │  │
│  └───────────────────────────────┘  │
│  ...                                │
└─────────────────────────────────────┘
  🏠      ▶️      📝⁵     📅      👤
```

---

### 👤 Perfil

Dados do usuário + configurações.

```
┌─────────────────────────────────────┐
│                                     │
│         [foto]                      │
│         Lucas Oliveira              │
│         olivmath@protonmail.com     │
│                                     │
├─────────────────────────────────────┤
│  🌙 Tema escuro          [ toggle ] │
│  🔔 Notificações         [ toggle ] │
├─────────────────────────────────────┤
│  [ Sair ]                           │
│                                     │
└─────────────────────────────────────┘
  🏠      ▶️      📝⁵     📅      👤
```

---

## Fluxo Completo

```
┌──────────┐    gera cards     ┌──────────┐
│ Simulado │ ───────────────▶  │ SRS Deck │
│ (novas)  │                   │          │
└──────────┘                   └────┬─────┘
                                    │ consome cards
                               ┌────▼─────┐
                               │ Revisão  │
                               │ (vistas) │
                               └──────────┘
                                    │
                               ┌────▼─────┐
                               │  Home    │
                               │ Análises │
                               │ Frequência│
                               └──────────┘
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firestore |
| Hosting | Firebase Hosting |
| Styling | Tailwind CSS + Material Web Components (MD3) |

---

## Estrutura do Projeto

```
src/
├── firebase/           # Config Firebase
├── hooks/
│   ├── useAuth.ts      # Auth state
│   ├── useSrs.ts       # SRS — pendingCards, updateCard, upsertFromResult
│   ├── useSimulado.ts  # Lógica do simulado
│   └── useResults.ts   # Histórico de resultados
├── pages/
│   ├── Home.tsx        # Dashboard: frequência + banner revisão + carrossel análises
│   ├── Simulado.tsx    # Fluxo de simulado (config → questões → resultado)
│   ├── Revisao.tsx     # Sessão de revisão SRS com flashcard (a implementar)
│   ├── Historico.tsx   # Lista de simulados realizados
│   └── Perfil.tsx      # Dados do usuário + configurações
├── utils/
│   └── sm2.ts          # Algoritmo SM-2
└── types/index.ts      # Tipos globais
```

---

## Comandos

```bash
pnpm install     # instalar dependências
pnpm dev         # dev server
pnpm build       # build produção
pnpm lint        # lint
pnpm typecheck   # type check
pnpm test        # testes
```
