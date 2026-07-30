import { createFileRoute } from '@tanstack/react-router'
import { db, dashboardSummary } from '@/lib/db'
import { handleApi, json } from '@/lib/http'

export const Route = createFileRoute('/api/agent/context')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        const database = db()
        const [profile, dashboard, checkins, body, nutrition, weeklyReviews] = await Promise.all([
          database.prepare('SELECT * FROM profile WHERE id = 1').first(),
          dashboardSummary(),
          database.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 30').all(),
          database.prepare('SELECT * FROM body_measurements ORDER BY date DESC LIMIT 30').all(),
          database.prepare('SELECT * FROM nutrition_logs ORDER BY date DESC, id DESC LIMIT 60').all(),
          database.prepare('SELECT * FROM weekly_reviews ORDER BY week_start DESC LIMIT 12').all(),
        ])
        return json({
          ok: true,
          data: {
            generatedAt: new Date().toISOString(),
            profile,
            dashboard,
            recentCheckins: checkins.results,
            recentBodyMeasurements: body.results,
            recentNutrition: nutrition.results,
            weeklyReviews: weeklyReviews.results,
          },
        })
      }),
    },
  },
})
