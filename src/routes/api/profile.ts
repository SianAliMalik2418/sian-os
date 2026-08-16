import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { profileSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'

export const Route = createFileRoute('/api/profile')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        return json({ ok: true, data: await db().prepare('SELECT * FROM profile WHERE id = 1').first() })
      }),
      PUT: async ({ request }) => handleApi(async () => {
        const input = profileSchema.parse(await readJson(request))
        await db().prepare(`
          INSERT INTO profile (id, height_cm, weight_kg, age, goals, experience_level, training_style, gym_schedule, equipment, injuries, long_term_vision, calorie_goal, protein_goal, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET height_cm=excluded.height_cm, weight_kg=excluded.weight_kg, age=excluded.age, goals=excluded.goals,
            experience_level=excluded.experience_level, training_style=excluded.training_style, gym_schedule=excluded.gym_schedule,
            equipment=excluded.equipment, injuries=excluded.injuries, long_term_vision=excluded.long_term_vision,
            calorie_goal=excluded.calorie_goal, protein_goal=excluded.protein_goal, updated_at=CURRENT_TIMESTAMP
        `).bind(nullable(input.height_cm), nullable(input.weight_kg), nullable(input.age), nullable(input.goals), nullable(input.experience_level), nullable(input.training_style), nullable(input.gym_schedule), nullable(input.equipment), nullable(input.injuries), nullable(input.long_term_vision), nullable(input.calorie_goal), nullable(input.protein_goal)).run()
        await recordApiWrite('upsert', 'profile', 1, input)
        return json({ ok: true, data: await db().prepare('SELECT * FROM profile WHERE id = 1').first() })
      }),
    },
  },
})
