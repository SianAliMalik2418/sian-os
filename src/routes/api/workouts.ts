import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { workoutSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'
import type { Workout } from '@/lib/types'

export const Route = createFileRoute('/api/workouts')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const requestedLimit = Number(new URL(request.url).searchParams.get('limit') || 100)
        const limit = Number.isFinite(requestedLimit) ? Math.min(200, Math.max(1, Math.trunc(requestedLimit))) : 100
        const result = await db().prepare(`
          SELECT w.*, COUNT(ws.id) AS set_count
          FROM workouts w LEFT JOIN workout_sets ws ON ws.workout_id = w.id
          GROUP BY w.id ORDER BY w.date DESC, w.id DESC LIMIT ?
        `).bind(limit).all<Workout & { set_count: number }>()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = workoutSchema.parse(await readJson(request))
        const resolvedSets: Array<{ exerciseId: number; set: typeof input.sets[number] }> = []
        for (const set of input.sets) {
          await db().prepare('INSERT OR IGNORE INTO exercises (name, muscle_group) VALUES (?, ?)').bind(set.exercise, nullable(set.muscle_group)).run()
          const exercise = await db().prepare('SELECT id FROM exercises WHERE name = ? COLLATE NOCASE').bind(set.exercise).first<{ id: number }>()
          if (!exercise) throw new HttpError(500, 'WRITE_FAILED', `Exercise could not be resolved: ${set.exercise}`)
          resolvedSets.push({ exerciseId: exercise.id, set })
        }
        const sequence = await db().prepare('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM workouts').first<{ id: number }>()
        const workoutId = sequence?.id
        if (!workoutId) throw new HttpError(500, 'WRITE_FAILED', 'Workout id could not be allocated')
        await db().batch([
          db().prepare('INSERT INTO workouts (id, date, title, program, duration_minutes, notes) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(workoutId, input.date, input.title, nullable(input.program), nullable(input.duration_minutes), nullable(input.notes)),
          ...resolvedSets.map(({ exerciseId, set }) => db().prepare('INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, rpe, rir, rest_seconds, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(workoutId, exerciseId, set.set_number, nullable(set.reps), nullable(set.weight_kg), nullable(set.rpe), nullable(set.rir), nullable(set.rest_seconds), nullable(set.notes))),
        ])
        await recordApiWrite('create', 'workout', workoutId, input)
        return json({ ok: true, data: { id: workoutId } }, { status: 201 })
      }),
    },
  },
})
