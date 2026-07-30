export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function startOfWeekIso(input = new Date()) {
  const date = new Date(input)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return isoDate(date)
}

export function calculateDailyStreak(rows: Array<{ date: string }>, now = new Date()) {
  if (rows.length === 0) return 0
  const dates = new Set(rows.map((row) => row.date))
  const cursor = new Date(now)
  if (!dates.has(isoDate(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1)
  let streak = 0
  while (dates.has(isoDate(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

export function estimatedOneRepMax(weightKg: number, reps: number) {
  if (weightKg <= 0 || reps <= 0) return null
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

export function progressionSuggestion(lastSet?: { reps: number | null; rpe: number | null }) {
  if (!lastSet) return 'Log your first working set to establish a baseline.'
  if (lastSet.rpe !== null && lastSet.rpe >= 9) return 'Maintain the load and improve readiness or execution before progressing.'
  if (lastSet.reps !== null && lastSet.reps >= 10) return 'You reached the top of a common rep range. Consider a small load increase.'
  return 'Keep the load and aim to add one clean rep next time.'
}
