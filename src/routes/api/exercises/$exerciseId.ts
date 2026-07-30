import { createFileRoute } from '@tanstack/react-router'
import { db, recentExerciseHistory } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'
import type { Exercise } from '@/lib/types'

export const Route = createFileRoute('/api/exercises/$exerciseId')({
  server: {
    handlers: {
      GET: async ({ params }) => handleApi(async () => {
        const id = Number(params.exerciseId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'INVALID_ID', 'Exercise id must be a positive integer')
        const exercise = await db().prepare('SELECT * FROM exercises WHERE id = ?').bind(id).first<Exercise>()
        if (!exercise) throw new HttpError(404, 'NOT_FOUND', 'Exercise not found')
        const [history, records] = await Promise.all([
          recentExerciseHistory(id),
          db().prepare(`
            SELECT MAX(weight_kg) AS max_weight,
              MAX(reps) AS max_reps,
              MAX(weight_kg * COALESCE(reps, 0)) AS best_set_volume,
              MAX(CASE WHEN reps > 0 AND weight_kg > 0 THEN weight_kg * (1 + reps / 30.0) END) AS estimated_1rm,
              COUNT(DISTINCT workout_id) AS sessions
            FROM workout_sets WHERE exercise_id = ?
          `).bind(id).first(),
        ])
        return json({ ok: true, data: { exercise, records, history } })
      }),
    },
  },
})
