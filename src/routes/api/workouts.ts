import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireAppAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { json, readJson } from '@/lib/http'
import { nullable } from '@/lib/sql'

const workoutSchema = z.object({
  date: z.string(), title: z.string(), program: z.string().optional(), duration_minutes: z.number().int().optional(), notes: z.string().optional(),
  sets: z.array(z.object({ exercise: z.string(), muscle_group: z.string().optional(), set_number: z.number().int(), reps: z.number().int().optional(), weight_kg: z.number().optional(), rpe: z.number().optional(), rir: z.number().optional(), rest_seconds: z.number().int().optional(), notes: z.string().optional() })).default([]),
})

export const Route = createFileRoute('/api/workouts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await requireAppAuth(request)
        const result = await db().prepare('SELECT * FROM workouts ORDER BY date DESC LIMIT 100').all()
        return json(result.results)
      },
      POST: async ({ request }) => {
        await requireAppAuth(request)
        const input = workoutSchema.parse(await readJson(request))
        const workout = await db().prepare('INSERT INTO workouts (date, title, program, duration_minutes, notes) VALUES (?, ?, ?, ?, ?) RETURNING id').bind(input.date, input.title, nullable(input.program), nullable(input.duration_minutes), nullable(input.notes)).first<{ id: number }>()
        for (const set of input.sets) {
          await db().prepare('INSERT OR IGNORE INTO exercises (name, muscle_group) VALUES (?, ?)').bind(set.exercise, nullable(set.muscle_group)).run()
          const exercise = await db().prepare('SELECT id FROM exercises WHERE name = ?').bind(set.exercise).first<{ id: number }>()
          if (!exercise || !workout) continue
          await db().prepare('INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, rpe, rir, rest_seconds, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(workout.id, exercise.id, set.set_number, nullable(set.reps), nullable(set.weight_kg), nullable(set.rpe), nullable(set.rir), nullable(set.rest_seconds), nullable(set.notes)).run()
        }
        return json({ ok: true, id: workout?.id })
      },
    },
  },
})
