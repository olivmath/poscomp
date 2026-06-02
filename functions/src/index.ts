import * as admin from 'firebase-admin'

admin.initializeApp()

export const db = admin.firestore()

export { getSimuladoQuestions } from './getSimuladoQuestions'
export { finishSimulado } from './finishSimulado'
export { getPendingCards } from './getPendingCards'
export { reviewCard } from './reviewCard'
export { deleteAllData } from './deleteAllData'
export { getFlaggedQuestions, resolveFlaggedQuestion } from './admin'
export { reportQuestion } from './reportQuestion'
export { setAdminRole, revokeAdminRole, listUsers, disableUser, enableUser, resetUserSrs, grantPremiumAdmin } from './adminUsers'
export { createQuestion, updateQuestion, deleteQuestion } from './adminQuestions'
export { createAnnouncement, updateAnnouncement, deleteAnnouncement } from './adminAnnouncements'
export { deleteFlaggedQuestion } from './deleteFlaggedQuestion'
export { submitPremiumRequest, reviewPremiumRequest, onPremiumRequestCreated } from './premiumRequests'
export { sendReviewReminder, sendStreakReminder, sendWeeklySimuladoReminder } from './notifications'
