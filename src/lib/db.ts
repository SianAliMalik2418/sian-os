import { env } from 'cloudflare:workers'
import { calculateDailyStreak, startOfWeekIso } from './metrics'
import type { DailyCheckin, DashboardSummary, ExerciseHistoryRow, Workout } from './types'

export const db = () => env.DB

export async function dashboardSummary(): Promise<DashboardSummary> {
  const database = db()
  const weekStart = startOfWeekIso()
  const [checkin, workouts, prs, weightTrend, streakRows, weeklyCheckins, weeklyWorkout] = await Promise.all([
    database.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 1').first<DailyCheckin>(),
    database.prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC LIMIT 5').all<Workout>(),
    database.prepare(`
      SELECT e.name, MAX(ws.weight_kg) AS max_weight, MAX(ws.reps) AS max_reps,
        MAX(CASE WHEN ws.reps > 0 AND ws.weight_kg > 0 THEN ws.weight_kg * (1 + ws.reps / 30.0) END) AS estimated_1rm
      FROM workout_sets ws JOIN exercises e ON e.id = ws.exercise_id
      GROUP BY e.id ORDER BY estimated_1rm DESC LIMIT 5
    `).all<{ name: string; max_weight: number | null; max_reps: number | null; estimated_1rm: number | null }>(),
    database.prepare('SELECT date, weight_kg FROM daily_checkins WHERE weight_kg IS NOT NULL ORDER BY date DESC LIMIT 14').all<{ date: string; weight_kg: number }>(),
    database.prepare("SELECT date FROM daily_checkins WHERE date >= date('now', '-120 days') ORDER BY date DESC").all<{ date: string }>(),
    database.prepare('SELECT date FROM daily_checkins WHERE date >= ? ORDER BY date').bind(weekStart).all<{ date: string }>(),
    database.prepare('SELECT COUNT(*) AS count FROM workouts WHERE date >= ?').bind(weekStart).first<{ count: number }>(),
  ])
  return {
    checkin,
    workouts: workouts.results,
    prs: prs.results,
    weightTrend: weightTrend.results,
    streak: calculateDailyStreak(streakRows.results),
    weeklyCheckins: weeklyCheckins.results,
    weeklyWorkoutCount: weeklyWorkout?.count ?? 0,
  }
}

export async function recentExerciseHistory(exerciseId: number) {
  const result = await db().prepare(`
    SELECT w.id AS workout_id, w.date, w.title, ws.set_number, ws.reps, ws.weight_kg, ws.rpe, ws.rir, ws.rest_seconds, ws.notes,
      CASE WHEN ws.reps > 0 AND ws.weight_kg > 0 THEN ROUND(ws.weight_kg * (1 + ws.reps / 30.0), 1) END AS estimated_1rm
    FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
    WHERE ws.exercise_id = ? ORDER BY w.date DESC, w.id DESC, ws.set_number ASC LIMIT 200
  `).bind(exerciseId).all<ExerciseHistoryRow>()
  return result.results
}

export async function recordApiWrite(action: string, entityType: string, entityId?: number | string, payload?: unknown) {
  await db().prepare('INSERT INTO agent_audit_log (action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?)')
    .bind(action, entityType, entityId === undefined ? null : String(entityId), payload === undefined ? null : JSON.stringify(payload))
    .run()
}
