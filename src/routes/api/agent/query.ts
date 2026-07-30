import { createFileRoute } from '@tanstack/react-router'
import { dashboardSummary, db } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'

export const Route = createFileRoute('/api/agent/query')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const mode = new URL(request.url).searchParams.get('mode')
        if (mode === 'dashboard') return json({ ok: true, data: await dashboardSummary() })
        if (mode === 'weekly-reviews') {
          const result = await db().prepare('SELECT * FROM weekly_reviews ORDER BY week_start DESC LIMIT 12').all()
          return json({ ok: true, data: result.results })
        }
        if (mode === 'body-progress') {
          const result = await db().prepare('SELECT * FROM body_measurements ORDER BY date DESC LIMIT 90').all()
          return json({ ok: true, data: result.results })
        }
        throw new HttpError(400, 'INVALID_MODE', 'mode must be dashboard, weekly-reviews, or body-progress')
      }),
    },
  },
})
