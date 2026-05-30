/**
 * Gera o campo `card` para cada questão usando Claude API.
 *
 * Matemática → card.resposta inclui conceito + resolução passo a passo em MD+LaTeX
 * Outras áreas → card.resposta inclui explicação do gabarito em MD
 *
 * Uso: npx tsx scripts/generate-cards.ts
 * Resume automaticamente a partir de um checkpoint se interrompido.
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const QUESTIONS_FILE = path.join(__dirname, 'data/questions.json')
const CHECKPOINT_FILE = path.join(__dirname, 'data/.cards-checkpoint.json')
const CONCURRENCY = 5

interface Question {
  id: number
  area: string
  enunciado: string
  alternativas: Record<string, string>
  resposta: string
  comentario?: string
  ano: number
  card?: { pergunta: string; resposta: string }
}

interface Checkpoint {
  processed: Record<number, { pergunta: string; resposta: string }>
}

const MATH_AREAS = ['Matemática']

function buildPrompt(q: Question): string {
  const ismath = MATH_AREAS.includes(q.area)
  const opts = Object.entries(q.alternativas)
    .map(([k, v]) => `${k}) ${v}`)
    .join('\n')

  const gabarito = `${q.resposta}) ${q.alternativas[q.resposta]}`
  const comentario = q.comentario ? `\nComentário: ${q.comentario}` : ''

  if (ismath) {
    return `Você é um tutor de Matemática para o POSCOMP. Dada a questão abaixo, gere:

1. **pergunta**: versão concisa do enunciado (máx 2 linhas), mantendo toda informação essencial para o flashcard
2. **resposta**: explicação completa com 2 seções obrigatórias em Markdown+LaTeX:
   - **## Conceito**: princípio teórico necessário para resolver (2-4 linhas, use LaTeX inline $...$ para expressões)
   - **## Resolução**: passo a passo completo usando LaTeX inline $...$ e blocos $$...$$

Questão (área: ${q.area}, ano: ${q.ano}):
${q.enunciado}

Alternativas:
${opts}

Gabarito: ${gabarito}${comentario}

Responda APENAS com JSON válido (sem markdown ao redor), exatamente neste formato:
{"pergunta": "...", "resposta": "..."}`
  }

  return `Você é um tutor de Ciência da Computação para o POSCOMP. Dada a questão abaixo, gere:

1. **pergunta**: versão concisa do enunciado (máx 2 linhas), mantendo toda informação essencial para o flashcard
2. **resposta**: explicação clara em Markdown (pode usar LaTeX inline $...$ se necessário) com:
   - Por que a alternativa correta está certa
   - Por que as demais estão erradas (se relevante)

Questão (área: ${q.area}, ano: ${q.ano}):
${q.enunciado}

Alternativas:
${opts}

Gabarito: ${gabarito}${comentario}

Responda APENAS com JSON válido (sem markdown ao redor), exatamente neste formato:
{"pergunta": "...", "resposta": "..."}`
}

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'))
  }
  return { processed: {} }
}

function saveCheckpoint(cp: Checkpoint): void {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2))
}

async function generateCard(
  client: Anthropic,
  q: Question,
): Promise<{ pergunta: string; resposta: string }> {
  const prompt = buildPrompt(q)

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  // Strip possible ```json ... ``` wrapper
  const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')

  try {
    const parsed = JSON.parse(clean)
    if (typeof parsed.pergunta !== 'string' || typeof parsed.resposta !== 'string') {
      throw new Error('Missing pergunta or resposta fields')
    }
    return { pergunta: parsed.pergunta, resposta: parsed.resposta }
  } catch {
    throw new Error(`Invalid JSON from model for question ${q.id}: ${clean.slice(0, 200)}`)
  }
}

async function processInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j)))
    results.push(...batchResults)
  }
  return results
}

async function main() {
  const questions: Question[] = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'))
  const checkpoint = loadCheckpoint()

  const pending = questions.filter((q) => !(q.id in checkpoint.processed) && !q.card)
  const alreadyDone = questions.filter((q) => q.id in checkpoint.processed || q.card)

  console.log(`Total: ${questions.length} | Já processadas: ${alreadyDone.length} | Pendentes: ${pending.length}`)

  if (pending.length === 0) {
    console.log('Nada a processar. Aplicando checkpoint ao arquivo...')
  } else {
    const client = new Anthropic()

    let done = 0
    const errors: number[] = []

    await processInBatches(pending, CONCURRENCY, async (q) => {
      try {
        const card = await generateCard(client, q)
        checkpoint.processed[q.id] = card
        done++
        const pct = Math.round(((alreadyDone.length + done) / questions.length) * 100)
        process.stdout.write(`\r[${alreadyDone.length + done}/${questions.length}] ${pct}%  `)
        // Save checkpoint every 10 questions
        if (done % 10 === 0) saveCheckpoint(checkpoint)
      } catch (err) {
        errors.push(q.id)
        console.error(`\n[ERRO] id=${q.id}: ${(err as Error).message}`)
      }
    })

    saveCheckpoint(checkpoint)
    console.log(`\nGeração concluída. Erros: ${errors.length > 0 ? errors.join(', ') : 'nenhum'}`)
  }

  // Apply checkpoint to questions array
  let applied = 0
  for (const q of questions) {
    if (checkpoint.processed[q.id] && !q.card) {
      q.card = checkpoint.processed[q.id]
      applied++
    }
  }

  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2))
  console.log(`Aplicados ${applied} cards ao questions.json`)

  // Update by_area files
  const byAreaDir = path.join(__dirname, 'data/by_area')
  const areaFiles = fs.readdirSync(byAreaDir).filter((f) => f.endsWith('.json'))
  for (const file of areaFiles) {
    const filePath = path.join(byAreaDir, file)
    const areaQuestions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    let updatedCount = 0
    for (const aq of areaQuestions) {
      const updated = questions.find((q) => q.id === aq.id)
      if (updated?.card && !aq.card) {
        aq.card = updated.card
        updatedCount++
      }
    }
    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(areaQuestions, null, 2))
      console.log(`  ${file}: ${updatedCount} cards atualizados`)
    }
  }

  // Clean up checkpoint after successful completion
  const allHaveCards = questions.every((q) => q.card)
  if (allHaveCards) {
    fs.unlinkSync(CHECKPOINT_FILE)
    console.log('Checkpoint removido. Todas as questões têm card.')
  } else {
    const missing = questions.filter((q) => !q.card).map((q) => q.id)
    console.warn(`Atenção: ${missing.length} questões ainda sem card: ${missing.slice(0, 10).join(', ')}...`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
