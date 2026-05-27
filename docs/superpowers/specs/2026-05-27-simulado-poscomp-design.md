# Design: Simulado POSCOMP — Histórico e Análises

**Data:** 2026-05-27  
**Status:** Aprovado  
**Escopo:** 10 questões fake no Firestore + fluxo completo de simulado integrado com Histórico e Análises

---

## Contexto

App React + Firebase para prática do POSCOMP (exame de pós-graduação em Computação). Já possui autenticação Google, bottom nav (Home, Histórico, Análises, Perfil) e Firestore configurado. As páginas Histórico, Análises e Perfil são placeholders.

---

## Decisões

| Dimensão | Decisão |
|---|---|
| Entrada do simulado | Botão na Home |
| Formato | Múltipla escolha A-E |
| Timer | 20 min global, submissão automática ao zerar |
| Questões iniciais | 10 fake no Firestore (seed script) |

---

## Firestore Schema

### `questions/` — coleção global

```ts
interface Question {
  id: string
  text: string
  options: { A: string; B: string; C: string; D: string; E: string }
  correctOption: 'A' | 'B' | 'C' | 'D' | 'E'
  area: 'Matemática' | 'Algoritmos' | 'Lógica' | 'Banco de Dados' | 'Redes'
  difficulty: 'fácil' | 'médio' | 'difícil'
}
```

### `users/{uid}/results/` — sub-coleção por usuário

```ts
interface SimuladoResult {
  id: string
  completedAt: Timestamp
  score: number                    // acertos (0–10)
  totalQuestions: 10
  timeSpentSeconds: number
  areaBreakdown: {
    [area: string]: { correct: number; total: number }
  }
  answers: Array<{
    questionId: string
    selected: 'A' | 'B' | 'C' | 'D' | 'E' | null   // null = não respondida
    correct: boolean
  }>
}
```

---

## Seed de Questões

Script TypeScript (`scripts/seed-questions.ts`) que insere 10 questões cobrindo 5 áreas (2 por área):

- **Matemática Discreta** — grafos, combinatória
- **Algoritmos e Estruturas de Dados** — complexidade, ordenação
- **Lógica de Programação** — predicados, recursão
- **Banco de Dados** — SQL, normalização
- **Redes de Computadores** — modelo OSI, TCP/IP

---

## Rotas

```
/simulado            ← fluxo completo (instrução → questão → resultado)
```

A rota `/simulado` gerencia estado interno via React state machine:
- `idle` → tela de instrução
- `running` → questão ativa + timer
- `finished` → tela de resultado

Não adiciona nova aba no bottom nav.

---

## Fluxo do Simulado (`/simulado`)

### Estado `idle` — Tela de instrução

- Card central com: "10 questões · 20 minutos · Múltipla escolha A-E"
- Último resultado do usuário (se houver): "Último: 7/10 · 15min"
- Botão primário "Começar"

### Estado `running` — Questão ativa

- **Header**: `3 / 10` à esquerda, timer `18:24` à direita (vermelho quando < 2min)
- **Enunciado** com texto da questão
- **5 opções** (A–E) como cards clicáveis; selecionado → destaque roxo
- **Botão "Próxima"** habilitado ao selecionar (última questão: "Finalizar")
- Timer zera → submissão automática das respostas parciais

### Estado `finished` — Resultado

- Score grande: `8 / 10`
- Tempo gasto: `14min 32s`
- Breakdown por área (tabela):
  ```
  Matemática          2/2   ✅
  Algoritmos          1/2   ⚠️
  Lógica              2/2   ✅
  Banco de Dados      2/2   ✅
  Redes               1/2   ⚠️
  ```
- Botão "Ver Histórico" → navega para `/historico`
- Botão "Refazer" → volta ao estado `idle`

---

## Página Histórico (`/historico`)

Lista de cards ordenados por data decrescente:

```
📅 27/05/2026   8/10   14min32s   >
📅 26/05/2026   6/10   18min45s   >
```

Clicando no card → expansão inline com breakdown por área daquele simulado.

Estado vazio: ilustração + "Nenhum simulado realizado ainda. Comece agora!"

---

## Página Análises (`/analises`)

Métricas agregadas de todos os simulados do usuário:

- **Acurácia geral**: `74%` (total de acertos / total de questões respondidas)
- **Melhor área**: `Matemática — 100%`
- **Área mais fraca**: `Redes — 40%`
- **Tabela por área**:
  ```
  Área               Acertos   Total   %
  Matemática            8         8    100%
  Algoritmos            5         8     63%
  Lógica                6         8     75%
  Banco de Dados        7         8     88%
  Redes                 3         8     38%
  ```
- **Linha do tempo**: últimos 5 simulados com score (mini sparkline de texto ou barras CSS)

Estado vazio: "Complete pelo menos um simulado para ver suas análises."

---

## Componentes Novos

| Componente | Responsabilidade |
|---|---|
| `pages/Simulado.tsx` | State machine idle→running→finished |
| `pages/Historico.tsx` | Lista de resultados do Firestore |
| `pages/Analises.tsx` | Agregação e exibição de métricas |
| `hooks/useSimulado.ts` | Lógica: buscar questões, gravar resultado, timer |
| `hooks/useResults.ts` | Leitura de `users/{uid}/results` |
| `scripts/seed-questions.ts` | Script de seed do Firestore |

---

## Fluxo de Dados

```
Firestore questions/ ──────────────────┐
                                       ▼
                              useSimulado.ts
                                       │
                    ┌──────────────────┤
                    │                  │
                    ▼                  ▼
             Simulado.tsx         gravar resultado
                                       │
                                       ▼
                              users/{uid}/results/
                                       │
                    ┌──────────────────┤
                    │                  │
                    ▼                  ▼
             Historico.tsx        Analises.tsx
```

---

## Tratamento de Erros

- **Sem conexão ao carregar questões**: mensagem de erro + botão "Tentar novamente"
- **Falha ao gravar resultado**: exibe resultado local mesmo assim; aviso "Não foi possível salvar"
- **Nenhuma questão no banco**: mensagem clara (não deve ocorrer após seed)

---

## Fora do Escopo

- Questões reais do POSCOMP (apenas fake)
- Ranking/comparação entre usuários
- Escolha de área ou quantidade de questões
- Modo revisão (ver gabarito após cada questão)
