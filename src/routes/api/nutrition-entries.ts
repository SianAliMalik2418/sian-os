import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite, syncDailyNutritionTotals } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { dateSchema, nutritionEntrySchema } from '@/lib/schemas'
import type { NutritionEntry } from '@/lib/types'

export const Route = createFileRoute('/api/nutrition-entries')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const url = new URL(request.url)
        const date = dateSchema.parse(url.searchParams.get('date'))
        const result = await db().prepare('SELECT * FROM nutrition_entries WHERE date = ? ORDER BY id').bind(date).all<NutritionEntry>()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = nutritionEntrySchema.parse(await readJson(request))
        const entry = await db().prepare(`
          INSERT INTO nutrition_entries (date, item_name, calories, protein_grams, fat_grams, carb_grams, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          RETURNING *
        `).bind(input.date, input.item_name, input.calories, input.protein_grams ?? 0, input.fat_grams ?? 0, input.carb_grams ?? 0).first<NutritionEntry>()
        const checkin = await syncDailyNutritionTotals(input.date)
        await recordApiWrite('create', 'nutrition_entry', entry?.id, input)
        return json({ ok: true, data: { entry, checkin } }, { status: 201 })
      }),
    },
  },
})
