import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { requireAppAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { json, readJson } from '@/lib/http'
import { nullable } from '@/lib/sql'

const checkinSchema = z.object({
  date: z.string(), weight_kg: z.number().optional(), sleep_hours: z.number().optional(), sleep_quality: z.number().int().optional(),
  water_liters: z.number().optional(), protein_grams: z.number().int().optional(), energy: z.number().int().optional(), motivation: z.number().int().optional(),
  recovery: z.number().int().optional(), mood: z.string().optional(), soreness: z.number().int().optional(), stress: z.number().int().optional(), notes: z.string().optional(),
})

export const Route = createFileRoute('/api/checkins')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await requireAppAuth(request)
        const result = await db().prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 90').all()
        return json(result.results)
      },
      POST: async ({ request }) => {
        try {
          await requireAppAuth(request)
          const input = checkinSchema.parse(await readJson(request))
          await db().prepare(`
            INSERT INTO daily_checkins (date, weight_kg, sleep_hours, sleep_quality, water_liters, protein_grams, energy, motivation, recovery, mood, soreness, stress, notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(date) DO UPDATE SET weight_kg=excluded.weight_kg, sleep_hours=excluded.sleep_hours, sleep_quality=excluded.sleep_quality, water_liters=excluded.water_liters, protein_grams=excluded.protein_grams, energy=excluded.energy, motivation=excluded.motivation, recovery=excluded.recovery, mood=excluded.mood, soreness=excluded.soreness, stress=excluded.stress, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP
          `).bind(input.date, nullable(input.weight_kg), nullable(input.sleep_hours), nullable(input.sleep_quality), nullable(input.water_liters), nullable(input.protein_grams), nullable(input.energy), nullable(input.motivation), nullable(input.recovery), nullable(input.mood), nullable(input.soreness), nullable(input.stress), nullable(input.notes)).run()
          return json({ ok: true })
        } catch (error) {
          if (error instanceof Response) return error
          return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
    },
  },
})
