import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { nutritionSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'

export const Route = createFileRoute('/api/nutrition')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const result = await db().prepare('SELECT * FROM nutrition_logs ORDER BY date DESC, id DESC LIMIT 365').all()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = nutritionSchema.parse(await readJson(request))
        const result = await db().prepare('INSERT INTO nutrition_logs (date, meal, protein_grams, water_liters, supplements, consistency, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(input.date, nullable(input.meal), nullable(input.protein_grams), nullable(input.water_liters), nullable(input.supplements), nullable(input.consistency), nullable(input.notes)).run()
        await recordApiWrite('create', 'nutrition_log', result.meta.last_row_id, input)
        return json({ ok: true, data: { id: result.meta.last_row_id } }, { status: 201 })
      }),
    },
  },
})
