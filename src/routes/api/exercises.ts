import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/lib/db'
import { handleApi, json } from '@/lib/http'
import type { Exercise } from '@/lib/types'

export const Route = createFileRoute('/api/exercises')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        const result = await db().prepare(`
          SELECT e.*, COUNT(DISTINCT ws.workout_id) AS workout_count, MAX(w.date) AS last_trained,
            MAX(ws.weight_kg) AS max_weight,
            MAX(CASE WHEN ws.reps > 0 AND ws.weight_kg > 0 THEN ws.weight_kg * (1 + ws.reps / 30.0) END) AS estimated_1rm
          FROM exercises e
          LEFT JOIN workout_sets ws ON ws.exercise_id = e.id
          LEFT JOIN workouts w ON w.id = ws.workout_id
          GROUP BY e.id ORDER BY COALESCE(last_trained, '') DESC, e.name COLLATE NOCASE
        `).all<Exercise & { workout_count: number; last_trained: string | null; max_weight: number | null; estimated_1rm: number | null }>()
        return json({ ok: true, data: result.results })
      }),
    },
  },
})
