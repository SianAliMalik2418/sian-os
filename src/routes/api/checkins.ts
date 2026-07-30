import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { checkinSchema } from '@/lib/schemas'
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
        const result = await db().prepare(`
          INSERT INTO daily_checkins (date, weight_kg, sleep_hours, sleep_quality, water_liters, protein_grams, energy, motivation, recovery, mood, soreness, stress, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(date) DO UPDATE SET weight_kg=excluded.weight_kg, sleep_hours=excluded.sleep_hours, sleep_quality=excluded.sleep_quality, water_liters=excluded.water_liters, protein_grams=excluded.protein_grams, energy=excluded.energy, motivation=excluded.motivation, recovery=excluded.recovery, mood=excluded.mood, soreness=excluded.soreness, stress=excluded.stress, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP
          RETURNING *
        `).bind(input.date, nullable(input.weight_kg), nullable(input.sleep_hours), nullable(input.sleep_quality), nullable(input.water_liters), nullable(input.protein_grams), nullable(input.energy), nullable(input.motivation), nullable(input.recovery), nullable(input.mood), nullable(input.soreness), nullable(input.stress), nullable(input.notes)).first<DailyCheckin>()
        await recordApiWrite('upsert', 'daily_checkin', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
