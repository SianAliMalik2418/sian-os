import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { sendSyncPush } from '@/lib/fcm'
import { handleApi, json } from '@/lib/http'

// No auth: this app is intentionally public (see AGENTS.md), unlike /api/wearable-metrics and
// /api/device-tokens which gate on MCP_API_KEY.
export const Route = createFileRoute('/api/sync-request')({
  server: {
    handlers: {
      POST: async () => handleApi(async () => {
        const result = await sendSyncPush(env)
        return json({ ok: true, data: { requested: result.requested } }, { status: 200 })
      }),
    },
  },
})
