import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json } from '@/lib/http'

async function buildExport() {
  const database = db()
  const [profile, checkins, exercises, workouts, sets, measurements, nutrition, photos, reviews, audit] = await Promise.all([
    database.prepare('SELECT * FROM profile').all(),
    database.prepare('SELECT * FROM daily_checkins ORDER BY date').all(),
    database.prepare('SELECT * FROM exercises ORDER BY id').all(),
    database.prepare('SELECT * FROM workouts ORDER BY date, id').all(),
    database.prepare('SELECT * FROM workout_sets ORDER BY workout_id, set_number, id').all(),
    database.prepare('SELECT * FROM body_measurements ORDER BY date, id').all(),
    database.prepare('SELECT * FROM nutrition_logs ORDER BY date, id').all(),
    database.prepare('SELECT * FROM progress_photos ORDER BY date, id').all(),
    database.prepare('SELECT * FROM weekly_reviews ORDER BY week_start').all(),
    database.prepare('SELECT * FROM agent_audit_log ORDER BY id').all(),
  ])
  return {
    format: 'sian-os-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      profile: profile.results,
      dailyCheckins: checkins.results,
      exercises: exercises.results,
      workouts: workouts.results,
      workoutSets: sets.results,
      bodyMeasurements: measurements.results,
      nutritionLogs: nutrition.results,
      progressPhotos: photos.results,
      weeklyReviews: reviews.results,
      agentAuditLog: audit.results,
    },
  }
}

export const Route = createFileRoute('/api/export')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const payload = await buildExport()
        const filename = `sian-os-export-${payload.exportedAt.slice(0, 10)}.json`
        return new Response(JSON.stringify(payload, null, 2), {
          headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' },
        })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const payload = await buildExport()
        const key = `backups/${payload.exportedAt.replace(/[:.]/g, '-')}.json`
        await env.FILES.put(key, JSON.stringify(payload), { httpMetadata: { contentType: 'application/json' } })
        await recordApiWrite('create', 'backup', key)
        return json({ ok: true, data: { key, exportedAt: payload.exportedAt } }, { status: 201 })
      }),
    },
  },
})
