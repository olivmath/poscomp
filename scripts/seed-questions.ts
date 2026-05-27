/**
 * Seed script — insere 10 questões fake no Firestore
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   FIREBASE_PROJECT_ID=seu-projeto \
 *   pnpm seed
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID
if (!projectId) throw new Error('FIREBASE_PROJECT_ID env var is required')

initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
  projectId,
})

const db = getFirestore()

const questions = [
  // ── Matemática Discreta ──────────────────────────────────────────────────
  {
    id: 'mat-01',
    text: 'Quantas arestas possui um grafo completo K₅ (5 vértices)?',
    options: {
      A: '8',
      B: '10',
      C: '12',
      D: '15',
      E: '20',
    },
    correctOption: 'B',
    area: 'Matemática',
    difficulty: 'fácil',
  },
  {
    id: 'mat-02',
    text: 'De quantas formas diferentes é possível escolher 3 elementos de um conjunto com 7 elementos, sem importar a ordem?',
    options: {
      A: '21',
      B: '35',
      C: '42',
      D: '70',
      E: '210',
    },
    correctOption: 'B',
    area: 'Matemática',
    difficulty: 'fácil',
  },

  // ── Algoritmos e Estruturas de Dados ─────────────────────────────────────
  {
    id: 'alg-01',
    text: 'Qual é a complexidade de tempo do algoritmo Merge Sort no pior caso?',
    options: {
      A: 'O(n)',
      B: 'O(n log n)',
      C: 'O(n²)',
      D: 'O(log n)',
      E: 'O(2ⁿ)',
    },
    correctOption: 'B',
    area: 'Algoritmos',
    difficulty: 'fácil',
  },
  {
    id: 'alg-02',
    text: 'Uma pilha (stack) implementada com array possui complexidade O(1) para qual operação?',
    options: {
      A: 'Busca de elemento no meio',
      B: 'Inserção no início',
      C: 'Push e Pop no topo',
      D: 'Ordenação interna',
      E: 'Inversão da pilha',
    },
    correctOption: 'C',
    area: 'Algoritmos',
    difficulty: 'fácil',
  },

  // ── Lógica de Programação ────────────────────────────────────────────────
  {
    id: 'log-01',
    text: 'Qual é o resultado de ∀x P(x) → ¬∃x ¬P(x)?',
    options: {
      A: 'Sempre falso',
      B: 'Sempre verdadeiro (tautologia)',
      C: 'Depende do domínio',
      D: 'Equivale a ∃x P(x)',
      E: 'Não é uma fórmula válida',
    },
    correctOption: 'B',
    area: 'Lógica',
    difficulty: 'médio',
  },
  {
    id: 'log-02',
    text: 'Uma função recursiva f(n) = f(n-1) + f(n-2), com f(0)=0 e f(1)=1, calcula qual sequência?',
    options: {
      A: 'Números primos',
      B: 'Potências de 2',
      C: 'Sequência de Fibonacci',
      D: 'Números fatoriais',
      E: 'Progressão aritmética',
    },
    correctOption: 'C',
    area: 'Lógica',
    difficulty: 'fácil',
  },

  // ── Banco de Dados ────────────────────────────────────────────────────────
  {
    id: 'bd-01',
    text: 'Uma relação está na 3FN (Terceira Forma Normal) quando elimina quais dependências?',
    options: {
      A: 'Dependências parciais da chave primária',
      B: 'Dependências transitivas em relação à chave primária',
      C: 'Redundâncias causadas por JOINs',
      D: 'Atributos multivalorados',
      E: 'Dependências de junção',
    },
    correctOption: 'B',
    area: 'Banco de Dados',
    difficulty: 'médio',
  },
  {
    id: 'bd-02',
    text: 'Qual cláusula SQL é usada para filtrar grupos após um GROUP BY?',
    options: {
      A: 'WHERE',
      B: 'FILTER',
      C: 'HAVING',
      D: 'GROUPBY',
      E: 'ON',
    },
    correctOption: 'C',
    area: 'Banco de Dados',
    difficulty: 'fácil',
  },

  // ── Redes de Computadores ─────────────────────────────────────────────────
  {
    id: 'red-01',
    text: 'Em qual camada do modelo OSI o protocolo TCP opera?',
    options: {
      A: 'Camada 2 — Enlace',
      B: 'Camada 3 — Rede',
      C: 'Camada 4 — Transporte',
      D: 'Camada 5 — Sessão',
      E: 'Camada 7 — Aplicação',
    },
    correctOption: 'C',
    area: 'Redes',
    difficulty: 'fácil',
  },
  {
    id: 'red-02',
    text: 'Qual é a principal diferença entre TCP e UDP?',
    options: {
      A: 'TCP usa endereços IP; UDP usa endereços MAC',
      B: 'TCP garante entrega confiável com confirmação; UDP não garante',
      C: 'UDP opera na camada de aplicação; TCP na camada de rede',
      D: 'TCP é mais rápido que UDP em todos os cenários',
      E: 'UDP usa conexão orientada; TCP não',
    },
    correctOption: 'B',
    area: 'Redes',
    difficulty: 'fácil',
  },
] as const

async function seed() {
  const batch = db.batch()

  for (const q of questions) {
    const ref = db.collection('questions').doc(q.id)
    batch.set(ref, q)
  }

  await batch.commit()
  console.log(`✅ ${questions.length} questões inseridas no Firestore (projeto: ${projectId})`)
}

seed().catch((err) => {
  console.error('❌ Seed falhou:', err)
  process.exit(1)
})
