import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { bodyMeasurementSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'

export const Route = createFileRoute('/api/body-measurements')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const result = await db().prepare('SELECT * FROM body_measurements ORDER BY date DESC, id DESC LIMIT 365').all()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = bodyMeasurementSchema.parse(await readJson(request))
        const result = await db().prepare('INSERT INTO body_measurements (date, weight_kg, chest_cm, waist_cm, hips_cm, arm_cm, thigh_cm, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(input.date, nullable(input.weight_kg), nullable(input.chest_cm), nullable(input.waist_cm), nullable(input.hips_cm), nullable(input.arm_cm), nullable(input.thigh_cm), nullable(input.notes)).run()
        await recordApiWrite('create', 'body_measurement', result.meta.last_row_id, input)
        return json({ ok: true, data: { id: result.meta.last_row_id } }, { status: 201 })
      }),
    },
  },
})
