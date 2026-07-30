import { env } from 'cloudflare:workers'

export const db = () => env.DB

export async function dashboardSummary() {
  const database = db()
  const [checkin, workouts, prs, weightTrend] = await Promise.all([
    database.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 1').first(),
    database.prepare('SELECT * FROM workouts ORDER BY date DESC LIMIT 5').all(),
    database.prepare(`
      SELECT e.name, MAX(ws.weight_kg) as max_weight, MAX(ws.reps) as max_reps
      FROM workout_sets ws JOIN exercises e ON e.id = ws.exercise_id
      GROUP BY e.id ORDER BY max_weight DESC LIMIT 5
    `).all(),
    database.prepare('SELECT date, weight_kg FROM daily_checkins WHERE weight_kg IS NOT NULL ORDER BY date DESC LIMIT 14').all(),
  ])
  return { checkin, workouts: workouts.results, prs: prs.results, weightTrend: weightTrend.results }
}

export async function recentExerciseHistory(exerciseId: number) {
  const result = await db().prepare(`
    SELECT w.date, w.title, ws.set_number, ws.reps, ws.weight_kg, ws.rpe, ws.rir, ws.notes
    FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
    WHERE ws.exercise_id = ? ORDER BY w.date DESC, ws.set_number ASC LIMIT 100
  `).bind(exerciseId).all()
  return result.results
}
