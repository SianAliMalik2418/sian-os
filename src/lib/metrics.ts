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

export function calculateSleepHours(sleepTime: string, wakeTime: string) {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number)
    return hours * 60 + minutes
  }
  const sleepMinutes = toMinutes(sleepTime)
  let wakeMinutes = toMinutes(wakeTime)
  if (wakeMinutes <= sleepMinutes) wakeMinutes += 24 * 60
  return Math.round(((wakeMinutes - sleepMinutes) / 60) * 100) / 100
}
