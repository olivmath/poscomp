import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

import { db } from './index'

export const deleteAllData = onCall(async (request) => {
  const uid = pipe(
    O.fromNullable(request.auth?.uid),
    O.getOrElseW(() => {
      throw new HttpsError('unauthenticated', 'Login required')
    }),
  )

  logger.info('Function deleteAllData started', { uid })

  await deleteCollection(`users/${uid}/srs_cards`)
  await deleteCollection(`users/${uid}/results`)

  logger.info('Function deleteAllData finished', { uid })

  return { deleted: true }
})

async function deleteCollection(collectionPath: string): Promise<void> {
  const BATCH_SIZE = 400

  const ref = db.collection(collectionPath)

  let deleted = 0

  for (;;) {
    const snap = await ref.limit(BATCH_SIZE).get()

    if (snap.empty) break

    const batch = db.batch()

    snap.docs.forEach((doc) => batch.delete(doc.ref))

    await batch.commit().catch((e) => {
      throw new HttpsError('internal', `Failed to delete ${collectionPath}`, e)
    })

    deleted += snap.size
  }

  logger.info(`Deleted ${deleted} docs from ${collectionPath}`)
}
