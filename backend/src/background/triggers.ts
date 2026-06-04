import { onDocumentCreated } from 'firebase-functions/v2/firestore'

export const onPremiumRequestCreated = onDocumentCreated(
  'premium_requests/{requestId}',
  (event) => {
    const data = event.data?.data()
    console.log('onPremiumRequestCreated', {
      requestId: event.params.requestId,
      uid: data?.['uid'],
      planType: data?.['planType'],
      status: data?.['status'],
    })
  }
)
