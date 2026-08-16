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
    waist_inches: { type: 'number', required: false, unit: 'inches' },
    sleep_hours: { type: 'number', required: false, unit: 'hours', min: 0, max: 24 },
    water_liters: { type: 'number', required: false, unit: 'liters' },
    protein_grams: { type: 'integer', required: false, unit: 'grams' },
    fat_grams: { type: 'integer', required: false, unit: 'grams' },
    carb_grams: { type: 'integer', required: false, unit: 'grams' },
    calories: { type: 'integer', required: false, unit: 'kcal' },
    nutrition_notes: { type: 'string', required: false, maxLength: 2000 },
    workout_text: { type: 'string', required: false, maxLength: 2000, note: 'Reviewer-facing workout notes derived from Lyfta; Lyfta remains authoritative for workout details.' },
    notes: { type: 'string', required: false, maxLength: 2000 },
  },
}

const recipeGuidance = {
  source: 'GET /api/recipes',
  rule: 'Before estimating nutrition from meal text, check savedRecipes by name and aliases. If a logged food clearly matches a saved recipe and serving, use that recipe calories and protein instead of estimating. Estimate only missing foods or unmatched recipes.',
  servingRule: 'Saved recipe calories and protein represent one normal serving unless serving_description says otherwise. If the owner logs multiple servings, multiply the saved values.',
  uncertaintyRule: 'If a match is ambiguous, state the assumption or ask for the serving instead of silently guessing.',
}

const nutritionTargetGuidance = {
  source: 'profile.calorie_goal and profile.protein_goal',
  rule: 'Use profile nutrition goals to calculate remaining daily calories and protein. The owner may update today during the day; treat the current daily check-in as a draft until the day is complete.',
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
        const [profile, dashboard, checkins, recipes] = await Promise.all([
          database.prepare('SELECT * FROM profile WHERE id = 1').first(),
          dashboardSummary(),
          database.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 30').all(),
          database.prepare('SELECT id, name, aliases, category, serving_description, calories, protein_grams, ingredients, notes, updated_at FROM recipes ORDER BY name COLLATE NOCASE LIMIT 500').all(),
        ])
        return json({
          ok: true,
          data: {
            generatedAt: new Date().toISOString(),
            profile,
            dashboard,
            recentCheckins: checkins.results,
            savedRecipes: recipes.results,
            agent: {
              checkinWriteContract,
              weeklyReportGuidance,
              recipeGuidance,
              nutritionTargetGuidance,
            },
          },
        })
      }),
    },
  },
})
