import * as admin from 'firebase-admin'

admin.initializeApp()

export const db = admin.firestore()

export { getSimuladoQuestions } from './getSimuladoQuestions'
export { finishSimulado } from './finishSimulado'
export { getPendingCards } from './getPendingCards'
export { reviewCard } from './reviewCard'
