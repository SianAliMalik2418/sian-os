import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { deviceTokenSchema } from '@/lib/schemas'
import type { DevicePushToken } from '@/lib/types'

// Same bearer-token check as src/routes/api/wearable-metrics.ts, duplicated for the same
// reason: the "Sian OS Sync" Android app registers unattended, so it needs to stay gated
// once MCP_API_KEY is set, unlike every other (open) REST route.
function isAuthorized(request: Request) {
  if (!env.MCP_API_KEY) return true
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
  return token === env.MCP_API_KEY
}

export const Route = createFileRoute('/api/device-tokens')({
  server: {
    handlers: {
      POST: async ({ request }) => handleApi(async () => {
        if (!isAuthorized(request)) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or missing bearer token')
        const input = deviceTokenSchema.parse(await readJson(request))
        const result = await db().prepare(`
          INSERT INTO device_push_tokens (fcm_token, platform)
          VALUES (?, 'android')
          ON CONFLICT(fcm_token) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `).bind(input.token).first<DevicePushToken>()
        await recordApiWrite('upsert', 'device_push_token', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
