import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { dashboardSummary, db, recentExerciseHistory } from './db'
import type { BodyMeasurement, DailyCheckin, Exercise, NutritionLog, ProgressPhoto, WeeklyReview, Workout, WorkoutSet } from './types'

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

export const getWorkoutData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const [workouts, sets, exercises] = await Promise.all([
    db().prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC LIMIT 100').all<Workout>(),
    db().prepare(`SELECT ws.*, e.name AS exercise_name FROM workout_sets ws JOIN exercises e ON e.id = ws.exercise_id ORDER BY ws.workout_id DESC, ws.set_number, ws.id`).all<WorkoutSet>(),
    db().prepare('SELECT * FROM exercises ORDER BY name COLLATE NOCASE').all<Exercise>(),
  ])
  return { workouts: workouts.results, sets: sets.results, exercises: exercises.results }
})

export const getExerciseData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const result = await db().prepare(`
    SELECT e.*, COUNT(DISTINCT ws.workout_id) AS workout_count, MAX(w.date) AS last_trained,
      MAX(ws.weight_kg) AS max_weight,
      MAX(CASE WHEN ws.reps > 0 AND ws.weight_kg > 0 THEN ws.weight_kg * (1 + ws.reps / 30.0) END) AS estimated_1rm
    FROM exercises e LEFT JOIN workout_sets ws ON ws.exercise_id=e.id LEFT JOIN workouts w ON w.id=ws.workout_id
    GROUP BY e.id ORDER BY COALESCE(last_trained, '') DESC, e.name COLLATE NOCASE
  `).all<Exercise & { workout_count: number; last_trained: string | null; max_weight: number | null; estimated_1rm: number | null }>()
  return result.results
})

export const getExerciseDetail = createServerFn({ method: 'GET' })
  .validator((data: { exerciseId: number }) => data)
  .handler(async ({ data }) => {
    disableCaching()
    const exercise = await db().prepare('SELECT * FROM exercises WHERE id = ?').bind(data.exerciseId).first<Exercise>()
    if (!exercise) throw new Error('Exercise not found')
    const [history, records] = await Promise.all([
      recentExerciseHistory(data.exerciseId),
      db().prepare(`SELECT MAX(weight_kg) AS max_weight, MAX(reps) AS max_reps, MAX(weight_kg * COALESCE(reps, 0)) AS best_set_volume,
        MAX(CASE WHEN reps > 0 AND weight_kg > 0 THEN weight_kg * (1 + reps / 30.0) END) AS estimated_1rm,
        COUNT(DISTINCT workout_id) AS sessions FROM workout_sets WHERE exercise_id = ?`).bind(data.exerciseId).first<{ max_weight: number | null; max_reps: number | null; best_set_volume: number | null; estimated_1rm: number | null; sessions: number }>(),
    ])
    return { exercise, history, records }
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
