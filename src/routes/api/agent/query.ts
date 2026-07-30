import { createFileRoute } from '@tanstack/react-router'
import { dashboardSummary } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'

export const Route = createFileRoute('/api/agent/query')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const mode = new URL(request.url).searchParams.get('mode')
        if (mode === 'dashboard') return json({ ok: true, data: await dashboardSummary() })
        throw new HttpError(400, 'INVALID_MODE', 'mode must be dashboard')
      }),
    },
  },
})
