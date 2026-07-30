import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { dashboardSummary, db } from './db'
import type { BodyMeasurement, DailyCheckin, NutritionLog, ProgressPhoto, WeeklyReview } from './types'

function disableCaching() {
  setResponseHeader('Cache-Control', 'no-store')
}

export const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  return dashboardSummary()
})

export const getTodayCheckin = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const today = new Date().toISOString().slice(0, 10)
  return db().prepare('SELECT * FROM daily_checkins WHERE date = ?').bind(today).first<DailyCheckin>()
})

export const getProgressData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const [measurements, nutrition, photos] = await Promise.all([
    db().prepare('SELECT * FROM body_measurements ORDER BY date DESC, id DESC LIMIT 365').all<BodyMeasurement>(),
    db().prepare('SELECT * FROM nutrition_logs ORDER BY date DESC, id DESC LIMIT 365').all<NutritionLog>(),
    db().prepare('SELECT id, date, label, notes, created_at FROM progress_photos ORDER BY date DESC, id DESC LIMIT 500').all<ProgressPhoto>(),
  ])
  return { measurements: measurements.results, nutrition: nutrition.results, photos: photos.results }
})

export const getWeeklyReviewData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  return (await db().prepare('SELECT * FROM weekly_reviews ORDER BY week_start DESC LIMIT 104').all<WeeklyReview>()).results
})
