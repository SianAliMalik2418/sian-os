import { createFileRoute } from '@tanstack/react-router'
import { requireAppAuth } from '@/lib/auth'
import { db, dashboardSummary } from '@/lib/db'
import { json } from '@/lib/http'

export const Route = createFileRoute('/api/agent/context')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await requireAppAuth(request)
        const [profile, dashboard, checkins, workouts] = await Promise.all([
          db().prepare('SELECT * FROM profile WHERE id = 1').first(),
          dashboardSummary(),
          db().prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 30').all(),
          db().prepare('SELECT * FROM workouts ORDER BY date DESC LIMIT 30').all(),
        ])
        return json({ profile, dashboard, recentCheckins: checkins.results, recentWorkouts: workouts.results })
      },
    },
  },
})
