import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { calculateSleepHours } from '@/lib/metrics'
import { checkinSchema, dateSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'
import type { DailyCheckin } from '@/lib/types'

export const Route = createFileRoute('/api/checkins')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const url = new URL(request.url)
        const requestedLimit = Number(url.searchParams.get('limit') || 90)
        const limit = Number.isFinite(requestedLimit) ? Math.min(365, Math.max(1, Math.trunc(requestedLimit))) : 90
        const date = url.searchParams.get('date')
        if (date) {
          const result = await db().prepare('SELECT * FROM daily_checkins WHERE date = ?').bind(date).first<DailyCheckin>()
          return json({ ok: true, data: result })
        }
        const result = await db().prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT ?').bind(limit).all<DailyCheckin>()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = checkinSchema.parse(await readJson(request))
        const sleepHours = input.sleep_time && input.wake_time ? calculateSleepHours(input.sleep_time, input.wake_time) : undefined
        const result = await db().prepare(`
          INSERT INTO daily_checkins (date, weight_kg, sleep_time, wake_time, sleep_hours, water_liters, protein_grams, nutrition_notes, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(date) DO UPDATE SET weight_kg=excluded.weight_kg, sleep_time=excluded.sleep_time, wake_time=excluded.wake_time, sleep_hours=excluded.sleep_hours, water_liters=excluded.water_liters, protein_grams=excluded.protein_grams, nutrition_notes=excluded.nutrition_notes, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP
          RETURNING *
        `).bind(input.date, nullable(input.weight_kg), nullable(input.sleep_time), nullable(input.wake_time), nullable(sleepHours), nullable(input.water_liters), nullable(input.protein_grams), nullable(input.nutrition_notes), nullable(input.notes)).first<DailyCheckin>()
        await recordApiWrite('upsert', 'daily_checkin', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
      DELETE: async ({ request }) => handleApi(async () => {
        const date = dateSchema.parse(new URL(request.url).searchParams.get('date'))
        const existing = await db().prepare('SELECT id FROM daily_checkins WHERE date = ?').bind(date).first<{ id: number }>()
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Daily check-in not found')
        await db().prepare('DELETE FROM daily_checkins WHERE id = ?').bind(existing.id).run()
        await recordApiWrite('delete', 'daily_checkin', existing.id, { date })
        return json({ ok: true })
      }),
    },
  },
})
