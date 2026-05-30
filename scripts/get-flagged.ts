import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID ?? 'poscomp-olivmath' })
const db = getFirestore()

const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RED    = '\x1b[31m'
const DIM    = '\x1b[2m'

async function main() {
  const snapshot = await db.collection('flagged_questions').where('resolved', '==', false).get()

  if (snapshot.empty) {
    console.log('Nenhuma questão sinalizada pendente.')
    return
  }

  console.log(`\n${BOLD}${snapshot.size} questão(ões) sinalizada(s) pendente(s):${RESET}\n`)

  for (const [i, doc] of snapshot.docs.entries()) {
    const flag = doc.data()
    const questionId = flag.questionId

    const qDoc = await db.collection('questions').doc(String(questionId)).get()
    const q = qDoc.exists ? qDoc.data() : null

    console.log(`${BOLD}${CYAN}[${i + 1}] Flag ID: ${doc.id}${RESET}  ${DIM}questionId: ${questionId}${RESET}`)
    console.log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`)

    if (q) {
      console.log(`${BOLD}Ano:${RESET}  ${q.ano}   ${BOLD}Área:${RESET} ${q.area}`)
      console.log(`\n${BOLD}Enunciado:${RESET}`)
      console.log(`  ${q.enunciado}`)
      console.log(`\n${BOLD}Alternativas:${RESET}`)
      for (const [opt, text] of Object.entries(q.alternativas ?? {})) {
        const marker = opt === q.resposta ? `${BOLD}${YELLOW}✓${RESET}` : ' '
        console.log(`  ${marker} ${BOLD}${opt})${RESET} ${text}`)
      }
      console.log(`\n${BOLD}Resposta:${RESET} ${YELLOW}${q.resposta}${RESET}`)
    } else {
      console.log(`${RED}Questão ${questionId} não encontrada na coleção questions.${RESET}`)
    }

    console.log(`\n${BOLD}${RED}Comentário do usuário:${RESET}`)
    console.log(`  ${YELLOW}${BOLD}"${flag.comment ?? '-'}"${RESET}`)
    console.log()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
