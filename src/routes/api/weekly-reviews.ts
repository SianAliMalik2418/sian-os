import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { weeklyReviewSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'

export const Route = createFileRoute('/api/weekly-reviews')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const result = await db().prepare('SELECT * FROM weekly_reviews ORDER BY week_start DESC LIMIT 104').all()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = weeklyReviewSchema.parse(await readJson(request))
        const database = db()
        const [workouts, weights, nutrition, recovery, bestWorkout] = await Promise.all([
          database.prepare("SELECT COUNT(*) AS count FROM workouts WHERE date BETWEEN ? AND date(?, '+6 days')").bind(input.week_start, input.week_start).first<{ count: number }>(),
          database.prepare("SELECT date, weight_kg FROM daily_checkins WHERE date BETWEEN ? AND date(?, '+6 days') AND weight_kg IS NOT NULL ORDER BY date").bind(input.week_start, input.week_start).all<{ date: string; weight_kg: number }>(),
          database.prepare("SELECT AVG(consistency) AS consistency, AVG(CASE WHEN water_liters >= 2 THEN 10 ELSE water_liters * 5 END) AS water FROM nutrition_logs WHERE date BETWEEN ? AND date(?, '+6 days')").bind(input.week_start, input.week_start).first<{ consistency: number | null; water: number | null }>(),
          database.prepare("SELECT AVG(recovery) AS quality FROM daily_checkins WHERE date BETWEEN ? AND date(?, '+6 days')").bind(input.week_start, input.week_start).first<{ quality: number | null }>(),
          database.prepare(`
            SELECT w.title, w.date, SUM(COALESCE(ws.weight_kg, 0) * COALESCE(ws.reps, 0)) AS volume
            FROM workouts w LEFT JOIN workout_sets ws ON ws.workout_id = w.id
            WHERE w.date BETWEEN ? AND date(?, '+6 days') GROUP BY w.id ORDER BY volume DESC LIMIT 1
          `).bind(input.week_start, input.week_start).first<{ title: string; date: string; volume: number }>(),
        ])
        const firstWeight = weights.results[0]?.weight_kg
        const lastWeight = weights.results.at(-1)?.weight_kg
        const weightChange = firstWeight === undefined || lastWeight === undefined ? null : lastWeight - firstWeight
        const workoutsCompleted = workouts?.count ?? 0
        await database.prepare(`
          INSERT INTO weekly_reviews (week_start, workouts_completed, missed_workouts, body_weight_change, nutrition_consistency, water_consistency, recovery_quality, best_workout, wins, lessons, focus_next_week)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(week_start) DO UPDATE SET workouts_completed=excluded.workouts_completed, missed_workouts=excluded.missed_workouts,
            body_weight_change=excluded.body_weight_change, nutrition_consistency=excluded.nutrition_consistency, water_consistency=excluded.water_consistency,
            recovery_quality=excluded.recovery_quality, best_workout=excluded.best_workout, wins=excluded.wins, lessons=excluded.lessons, focus_next_week=excluded.focus_next_week
        `).bind(
          input.week_start,
          workoutsCompleted,
          input.missed_workouts ?? 0,
          weightChange,
          nutrition?.consistency === null ? null : Math.round(nutrition?.consistency ?? 0),
          nutrition?.water === null ? null : Math.round(nutrition?.water ?? 0),
          recovery?.quality === null ? null : Math.round(recovery?.quality ?? 0),
          bestWorkout ? `${bestWorkout.title} (${bestWorkout.date})` : null,
          nullable(input.wins),
          nullable(input.lessons),
          nullable(input.focus_next_week),
        ).run()
        const review = await database.prepare('SELECT * FROM weekly_reviews WHERE week_start = ?').bind(input.week_start).first()
        await recordApiWrite('upsert', 'weekly_review', input.week_start, input)
        return json({ ok: true, data: review })
      }),
    },
  },
})
