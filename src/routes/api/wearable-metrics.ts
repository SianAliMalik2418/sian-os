import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { wearableMetricsSchema } from '@/lib/schemas'
import { nullable } from '@/lib/sql'
import type { DailyCheckin } from '@/lib/types'

// Same bearer-token check as src/routes/api/mcp.ts, duplicated rather than shared since it's
// the only other route with inbound auth. Wearable syncs (Tasker) push unattended, so unlike
// every other REST route this one can't stay open even for local dev convenience once a key is set.
function isAuthorized(request: Request) {
  if (!env.MCP_API_KEY) return true
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
  return token === env.MCP_API_KEY
}

export const Route = createFileRoute('/api/wearable-metrics')({
  server: {
    handlers: {
      POST: async ({ request }) => handleApi(async () => {
        if (!isAuthorized(request)) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or missing bearer token')
        const input = wearableMetricsSchema.parse(await readJson(request))
        // Narrow partial upsert: only touches steps/active_calories/sleep_hours, unlike
        // /api/checkins which fully replaces the row. Keeps an unattended wearable sync from
        // clearing manually-entered fields like weight_kg or notes when it writes.
        const result = await db().prepare(`
          INSERT INTO daily_checkins (date, steps, active_calories, sleep_hours, updated_at, wearable_synced_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(date) DO UPDATE SET
            steps = COALESCE(excluded.steps, daily_checkins.steps),
            active_calories = COALESCE(excluded.active_calories, daily_checkins.active_calories),
            sleep_hours = COALESCE(excluded.sleep_hours, daily_checkins.sleep_hours),
            updated_at = CURRENT_TIMESTAMP,
            wearable_synced_at = CURRENT_TIMESTAMP
          RETURNING *
        `).bind(input.date, nullable(input.steps), nullable(input.active_calories), nullable(input.sleep_hours)).first<DailyCheckin>()
        await recordApiWrite('upsert', 'wearable_metrics', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
