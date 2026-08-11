import { createFileRoute } from '@tanstack/react-router'
import { db, dashboardSummary } from '@/lib/db'
import { handleApi, json } from '@/lib/http'

const checkinWriteContract = {
  endpoint: 'POST /api/checkins',
  upsertKey: 'date',
  readBeforeWrite: 'GET /api/checkins?date=YYYY-MM-DD',
  verifyAfterWrite: 'GET /api/checkins?date=YYYY-MM-DD',
  warning: 'Omitted optional fields are cleared on upsert, so preserve existing confirmed values when updating.',
  fields: {
    date: { type: 'string', required: true, format: 'YYYY-MM-DD' },
    weight_kg: { type: 'number', required: false, unit: 'kg' },
    sleep_time: { type: 'string', required: false, format: 'HH:mm', pairWith: 'wake_time' },
    wake_time: { type: 'string', required: false, format: 'HH:mm', pairWith: 'sleep_time' },
    water_liters: { type: 'number', required: false, unit: 'liters' },
    protein_grams: { type: 'integer', required: false, unit: 'grams' },
    calories: { type: 'integer', required: false, unit: 'kcal' },
    nutrition_notes: { type: 'string', required: false, maxLength: 2000 },
    workout_text: { type: 'string', required: false, maxLength: 2000, note: 'Reviewer-facing workout notes derived from Lyfta; Lyfta remains authoritative for workout details.' },
    notes: { type: 'string', required: false, maxLength: 2000 },
  },
}

const weeklyReportGuidance = {
  source: 'GET /api/checkins?limit=30',
  state: 'GET /api/agent/state?key=last_weekly_report_date',
  updateState: 'PUT /api/agent/state with { "key": "last_weekly_report_date", "value": "YYYY-MM-DD" } after giving a weekly report.',
  rule: 'Include a weekly summary only when at least 7 newer logged days exist since last_weekly_report_date.',
  range: 'Use the last 7 logged days, sorted by date, unless the owner specifies a different range.',
}

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
            agent: {
              checkinWriteContract,
              weeklyReportGuidance,
            },
          },
        })
      }),
    },
  },
})
