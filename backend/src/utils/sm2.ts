export function applySm2(
  card: { interval: number; easeFactor: number; repetitions: number },
  studied: boolean
) {
  let { interval, easeFactor, repetitions } = card
  if (studied) {
    interval = Math.min(Math.round(interval * easeFactor), 365)
    easeFactor = easeFactor + 0.1
    repetitions = repetitions + 1
  } else {
    interval = 1
    easeFactor = Math.max(1.3, easeFactor - 0.2)
    repetitions = 0
  }
  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + interval)
  return { interval, easeFactor, repetitions, nextDueDate }
}
