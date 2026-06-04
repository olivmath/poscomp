import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requireAuth } from '../utils/auth'
import { VALID_MATERIAS, Materia, Question } from '../types'

export const getSimuladoQuestions = onCall(async (request) => {
  const auth = requireAuth(request)
  const { materias, total } = request.data as { materias: Materia[]; total: number }

  console.log('getSimuladoQuestions started', { uid: auth.uid, materias, total })

  if (!Number.isInteger(total) || total <= 0) {
    throw new HttpsError('invalid-argument', 'total must be a positive integer')
  }
  if (!Array.isArray(materias)) {
    throw new HttpsError('invalid-argument', 'materias must be an array')
  }
  if (materias.length > 0) {
    for (const m of materias) {
      if (!VALID_MATERIAS.includes(m)) {
        throw new HttpsError('invalid-argument', `Invalid materia: ${m}`)
      }
    }
  }

  const db = admin.firestore()
  let query: FirebaseFirestore.Query = db.collection('questions')
  if (materias.length > 0) {
    query = query.where('materia', 'in', materias)
  }

  let snapshot: FirebaseFirestore.QuerySnapshot
  try {
    snapshot = await query.get()
  } catch (e) {
    throw new HttpsError('internal', 'Firestore error')
  }

  if (snapshot.empty) {
    throw new HttpsError('not-found', 'No questions found for selected areas')
  }

  const questions = snapshot.docs.map((d) => d.data() as Question)
  questions.sort(() => Math.random() - 0.5)
  const result = questions.slice(0, total)

  console.log('getSimuladoQuestions finished', { uid: auth.uid, returned: result.length })
  return { questions: result }
})
