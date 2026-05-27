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
| **Tipo 3** | Conteúdo que **já estudou** e mesmo assim errou | Investiga o erro. Cria nota de revisão. **Foco total.** |

No app, o usuário classifica cada card durante a revisão com dois botões: **"Não estudei"** / **"Estudei"** — que mapeiam para os tipos acima.

---

## Sistema de Revisão Espaçada (SRS)

### Algoritmo: SM-2

O app usa o algoritmo **SM-2 (SuperMemo 2)** para agendar revisões no momento certo, explorando a curva do esquecimento de Ebbinghaus.

Cada `SrsCard` tem:
- `easeFactor` — quão fácil o card é pra você (começa em 2.5)
- `interval` — dias até a próxima revisão
- `repetitions` — revisões bem-sucedidas consecutivas
- `dueDate` — data da próxima revisão
- `studied` — o usuário já estudou esse conteúdo? (classificado na revisão)
- `simuladoCorrect` — foi acertado no simulado original?

### Fila de revisão — Prioridade 2×2

Os cards pendentes são ordenados por uma matriz de prioridade baseada em duas dimensões:

|  | Errei no simulado | Acertei no simulado |
|---|---|---|
| **Estudei** | 🔴 **P1** — Gap real, urgente | ⚪ **P4** — Domina, manutenção |
| **Não estudei** | 🟠 **P3** — Ainda não é hora | 🟡 **P2** — Acertou sem estudar? Confirmar |

#### Ordem de aparição na sessão de revisão

```
P1 → estudei   + errei     ← aparece PRIMEIRO (gap real)
P2 → não estudei + acertei ← (pode ser chute, precisa confirmar)
P3 → não estudei + errei   ← (não está pronto ainda)
P4 → estudei   + acertei   ← aparece POR ÚLTIMO (tudo certo)
```

Dentro de cada grupo → SM-2 ordena por `dueDate`.

---

## Fluxo do Usuário

### 1. Simulado
- Responde questões novas (aleatórias ou por área)
- Marca confiança: `certain` / `unsure`
- Ao terminar → todos os erros e respostas com `unsure` geram `SrsCard`

### 2. Sessão de Revisão (`/revisao`)
- Mostra cards pendentes na ordem de prioridade P1 → P4
- Para cada card:

```
┌─────────────────────────────┐
│  [Área] Questão XX          │
│                             │
│  Enunciado da questão...    │
│                             │
│   [ Revelar gabarito ]      │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  Gabarito: (D) O(log n)     │
│                             │
│ [ Não estudei ] [ Estudei ] │
└─────────────────────────────┘
```

- **"Estudei"** → `studied: true` → SM-2 avança (intervalo cresce)
- **"Não estudei"** → `studied: false` → card vai para P3 ou P4, aparece por último

### 3. Acesso à Revisão
- **BottomNav**: aba "Revisar" com badge mostrando quantidade de cards pendentes hoje
- **Home**: card com CTA "X questões para revisar"

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
├── firebase/          # Config Firebase
├── hooks/
│   ├── useAuth.ts     # Auth state
│   ├── useSrs.ts      # SRS — pendingCards, updateCard, upsertFromResult
│   ├── useSimulado.ts # Lógica do simulado
│   └── useResults.ts  # Histórico de resultados
├── pages/
│   ├── Home.tsx       # Dashboard + card de revisão
│   ├── Simulado.tsx   # Fluxo de simulado
│   ├── Revisao.tsx    # Sessão de revisão (a implementar)
│   ├── Analises.tsx   # Análises por área
│   ├── Historico.tsx  # Histórico de simulados
│   └── Perfil.tsx
├── utils/
│   └── sm2.ts         # Algoritmo SM-2
└── types/index.ts     # Tipos globais
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
