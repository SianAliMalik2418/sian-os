import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite, syncDailyNutritionTotals } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'

export const Route = createFileRoute('/api/nutrition-entries/$entryId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => handleApi(async () => {
        const id = Number(params.entryId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid nutrition entry id')
        const existing = await db().prepare('SELECT id, date FROM nutrition_entries WHERE id = ?').bind(id).first<{ id: number; date: string }>()
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Nutrition entry not found')
        await db().prepare('DELETE FROM nutrition_entries WHERE id = ?').bind(id).run()
        const checkin = await syncDailyNutritionTotals(existing.date)
        await recordApiWrite('delete', 'nutrition_entry', id, { date: existing.date })
        return json({ ok: true, data: { checkin } })
      }),
    },
  },
})
