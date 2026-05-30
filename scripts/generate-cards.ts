/**
 * Gera o campo `card` para cada questão usando Claude API.
 *
 * Uso:
 *   npx tsx scripts/generate-cards.ts           # só questões sem card
 *   npx tsx scripts/generate-cards.ts --force   # regenera todos os cards
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const QUESTIONS_FILE = path.join(__dirname, 'data/questions.json')
const CHECKPOINT_FILE = path.join(__dirname, 'data/.cards-checkpoint.json')
const DATA_DIR = path.join(__dirname, 'data')
const CONCURRENCY = 3
const FORCE = process.argv.includes('--force')

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
  const opts = Object.entries(q.alternativas)
    .map(([k, v]) => `${k}) ${v}`)
    .join('\n')

  const gabarito = `${q.resposta}) ${q.alternativas[q.resposta]}`
  const comentario = q.comentario ? `\nComentário oficial: ${q.comentario}` : ''
  const ismath = MATH_AREAS.includes(q.area)

  if (ismath) {
    return `Você é um professor de Matemática preparando material de revisão para o POSCOMP. Crie um MICRO-TUTORIAL completo para a questão abaixo — não uma resposta seca, mas uma mini-aula que ensina o conceito e resolve do zero.

QUESTÃO (área: ${q.area}, ano: ${q.ano}):
${q.enunciado}

ALTERNATIVAS:
${opts}

GABARITO: ${gabarito}${comentario}

Gere um JSON com dois campos:

"pergunta": versão concisa do enunciado (máx 2 linhas), mantendo os dados essenciais.

"resposta": MICRO-TUTORIAL em Markdown+LaTeX com EXATAMENTE estas seções:

## Conceito
Explique o princípio teórico de forma COMPLETA (3-6 linhas). Dê a fórmula geral em LaTeX, defina cada variável, explique a intuição. Não seja raso.

## Resolução
Passo a passo DETALHADO partindo dos dados do enunciado. Cada etapa numerada com a operação matemática completa em LaTeX. Não pule etapas intermediárias. Termine com o resultado final.

**Gabarito: (${q.resposta})** $resultado$

REGRAS:
- Use $...$ para matemática inline e $$...$$ para equações em destaque
- Cada passo deve mostrar a operação completa, não só o resultado
- O conceito deve ser didático o suficiente para quem nunca viu o assunto entender
- NUNCA omita etapas da resolução

Responda APENAS com JSON válido (sem markdown ao redor):
{"pergunta": "...", "resposta": "..."}`
  }

  return `Você é um professor de Ciência da Computação preparando material de revisão para o POSCOMP. Crie um MICRO-TUTORIAL completo — não uma resposta seca, mas uma mini-aula que ensina o conceito e explica cada alternativa.

QUESTÃO (área: ${q.area}, ano: ${q.ano}):
${q.enunciado}

ALTERNATIVAS:
${opts}

GABARITO: ${gabarito}${comentario}

Gere um JSON com dois campos:

"pergunta": versão concisa do enunciado (máx 2 linhas), mantendo os dados essenciais.

"resposta": MICRO-TUTORIAL em Markdown com EXATAMENTE estas seções:

## Conceito
Explique o tema central de forma COMPLETA (3-6 linhas). O que é, como funciona, propriedades chave, exemplo prático. Seja didático — escreva como se fosse a primeira vez que o aluno vê o assunto. Use LaTeX inline $...$ quando houver expressões formais.

## Por que (${q.resposta}) é correta
Explicação direta e precisa do porquê o gabarito está certo (2-4 linhas).

## Pegadinhas desta questão
Para CADA alternativa incorreta, uma linha explicando por que ela atrai candidatos e onde está o erro conceitual. Formato: **(X)** motivo do erro.

**Gabarito: (${q.resposta})**

REGRAS:
- O conceito deve ser autocontido: o aluno não deve precisar buscar nada além
- As pegadinhas devem revelar o raciocínio errado típico, não só dizer "está errado"
- Seja específico com nomes de algoritmos, propriedades, complexidades quando relevante

Responda APENAS com JSON válido (sem markdown ao redor):
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
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

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

  if (FORCE) {
    console.log('--force: removendo cards existentes e checkpoint para regeneração completa...')
    for (const q of questions) delete q.card
    if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE)
  }

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

  // Update individual area files in data/
  const areaFiles = fs.readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'questions.json')

  for (const file of areaFiles) {
    const filePath = path.join(DATA_DIR, file)
    const areaQuestions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    let updatedCount = 0
    for (const aq of areaQuestions) {
      const updated = questions.find((q) => q.id === aq.id)
      if (updated?.card) {
        aq.card = updated.card
        updatedCount++
      }
    }
    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(areaQuestions, null, 2))
      console.log(`  ${file}: ${updatedCount} cards atualizados`)
    }
  }

  const allHaveCards = questions.every((q) => q.card)
  if (allHaveCards && fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE)
    console.log('Checkpoint removido. Todas as questões têm card.')
  } else if (!allHaveCards) {
    const missing = questions.filter((q) => !q.card).map((q) => q.id)
    console.warn(`Atenção: ${missing.length} questões ainda sem card: ${missing.slice(0, 10).join(', ')}...`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
