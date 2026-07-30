import { createFileRoute } from '@tanstack/react-router'
import { db, dashboardSummary } from '@/lib/db'
import { handleApi, json } from '@/lib/http'

export const Route = createFileRoute('/api/agent/context')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        const database = db()
        const [profile, dashboard, checkins] = await Promise.all([
          database.prepare('SELECT * FROM profile WHERE id = 1').first(),
          dashboardSummary(),
          database.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 30').all(),
        ])
        return json({
          ok: true,
          data: {
            generatedAt: new Date().toISOString(),
            profile,
            dashboard,
            recentCheckins: checkins.results,
          },
        })
      }),
    },
  },
})
