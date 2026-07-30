import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { workoutSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'
import type { Workout, WorkoutSet } from '@/lib/types'

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'INVALID_ID', 'Workout id must be a positive integer')
  return id
}

export const Route = createFileRoute('/api/workouts/$workoutId')({
  server: {
    handlers: {
      GET: async ({ params }) => handleApi(async () => {
        const id = parseId(params.workoutId)
        const [workout, sets] = await Promise.all([
          db().prepare('SELECT * FROM workouts WHERE id = ?').bind(id).first<Workout>(),
          db().prepare(`
            SELECT ws.*, e.name AS exercise_name FROM workout_sets ws
            JOIN exercises e ON e.id = ws.exercise_id
            WHERE ws.workout_id = ? ORDER BY ws.set_number, ws.id
          `).bind(id).all<WorkoutSet>(),
        ])
        if (!workout) throw new HttpError(404, 'NOT_FOUND', 'Workout not found')
        return json({ ok: true, data: { ...workout, sets: sets.results } })
      }),
      PUT: async ({ request, params }) => handleApi(async () => {
        const id = parseId(params.workoutId)
        const input = workoutSchema.parse(await readJson(request))
        const exists = await db().prepare('SELECT id FROM workouts WHERE id = ?').bind(id).first()
        if (!exists) throw new HttpError(404, 'NOT_FOUND', 'Workout not found')

        const resolvedSets: Array<{ exerciseId: number; set: typeof input.sets[number] }> = []
        for (const set of input.sets) {
          await db().prepare('INSERT OR IGNORE INTO exercises (name, muscle_group) VALUES (?, ?)').bind(set.exercise, nullable(set.muscle_group)).run()
          const exercise = await db().prepare('SELECT id FROM exercises WHERE name = ? COLLATE NOCASE').bind(set.exercise).first<{ id: number }>()
          if (!exercise) throw new HttpError(500, 'WRITE_FAILED', `Exercise could not be resolved: ${set.exercise}`)
          resolvedSets.push({ exerciseId: exercise.id, set })
        }

        const statements = [
          db().prepare('UPDATE workouts SET date = ?, title = ?, program = ?, duration_minutes = ?, notes = ? WHERE id = ?')
            .bind(input.date, input.title, nullable(input.program), nullable(input.duration_minutes), nullable(input.notes), id),
          db().prepare('DELETE FROM workout_sets WHERE workout_id = ?').bind(id),
          ...resolvedSets.map(({ exerciseId, set }) => db().prepare('INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, rpe, rir, rest_seconds, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(id, exerciseId, set.set_number, nullable(set.reps), nullable(set.weight_kg), nullable(set.rpe), nullable(set.rir), nullable(set.rest_seconds), nullable(set.notes))),
        ]
        await db().batch(statements)
        await recordApiWrite('update', 'workout', id, input)
        return json({ ok: true, data: { id } })
      }),
      DELETE: async ({ params }) => handleApi(async () => {
        const id = parseId(params.workoutId)
        const results = await db().batch([
          db().prepare('DELETE FROM workout_sets WHERE workout_id = ?').bind(id),
          db().prepare('DELETE FROM workouts WHERE id = ?').bind(id),
        ])
        if (!results[1]?.meta.changes) throw new HttpError(404, 'NOT_FOUND', 'Workout not found')
        await recordApiWrite('delete', 'workout', id)
        return json({ ok: true })
      }),
    },
  },
})
