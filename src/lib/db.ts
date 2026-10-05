import { env } from 'cloudflare:workers'
import { calculateDailyStreak, startOfWeekIso } from './metrics'
import type { DailyCheckin, DashboardSummary, GoalPhase, NutritionEntry, Profile } from './types'
import type { GoalPhaseInput } from './schemas'

export const db = () => env.DB

export async function dashboardSummary(): Promise<DashboardSummary> {
  const database = db()
  const weekStart = startOfWeekIso()
  const today = new Date().toISOString().slice(0, 10)
  const [checkin, profile, nutritionEntries, weightTrend, streakRows, weeklyCheckins, activeGoalPhase] = await Promise.all([
    database.prepare('SELECT * FROM daily_checkins WHERE date = ?').bind(today).first<DailyCheckin>(),
    database.prepare('SELECT * FROM profile WHERE id = 1').first<Profile>(),
    database.prepare('SELECT * FROM nutrition_entries WHERE date = ? ORDER BY id').bind(today).all<NutritionEntry>(),
    database.prepare('SELECT date, weight_kg FROM daily_checkins WHERE weight_kg IS NOT NULL ORDER BY date DESC LIMIT 14').all<{ date: string; weight_kg: number }>(),
    database.prepare("SELECT date FROM daily_checkins WHERE date >= date('now', '-120 days') ORDER BY date DESC").all<{ date: string }>(),
    database.prepare('SELECT date FROM daily_checkins WHERE date >= ? ORDER BY date').bind(weekStart).all<{ date: string }>(),
    getActiveGoalPhase(),
  ])
  return {
    checkin,
    profile,
    nutritionEntries: nutritionEntries.results,
    weightTrend: weightTrend.results,
    streak: calculateDailyStreak(streakRows.results),
    weeklyCheckins: weeklyCheckins.results,
    activeGoalPhase,
  }
}

export async function getActiveGoalPhase() {
  return db().prepare('SELECT * FROM goal_phases WHERE is_active = 1 ORDER BY started_at DESC, id DESC LIMIT 1').first<GoalPhase>()
}

export async function startGoalPhase(input: GoalPhaseInput) {
  const database = db()
  await database.prepare(`
    UPDATE goal_phases SET ended_at = ?, is_active = 0
    WHERE is_active = 1
  `).bind(input.started_at).run()
  return database.prepare(`
    INSERT INTO goal_phases (phase_type, target_rate_kg_per_week, note, started_at)
    VALUES (?, ?, ?, ?)
    RETURNING *
  `).bind(
    input.phase_type,
    input.target_rate_kg_per_week ?? null,
    input.note ?? null,
    input.started_at,
  ).first<GoalPhase>()
}

export async function syncDailyNutritionTotals(date: string) {
  const totals = await db().prepare(`
    SELECT
      COALESCE(SUM(calories), 0) AS calories,
      COALESCE(SUM(protein_grams), 0) AS protein_grams,
      COALESCE(SUM(fat_grams), 0) AS fat_grams,
      COALESCE(SUM(carb_grams), 0) AS carb_grams
    FROM nutrition_entries
    WHERE date = ?
  `).bind(date).first<{ calories: number; protein_grams: number; fat_grams: number; carb_grams: number }>()
  const calories = totals?.calories ?? 0
  const protein = totals?.protein_grams ?? 0
  const fats = totals?.fat_grams ?? 0
  const carbs = totals?.carb_grams ?? 0
  return db().prepare(`
    INSERT INTO daily_checkins (date, calories, protein_grams, fat_grams, carb_grams, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(date) DO UPDATE SET calories=excluded.calories, protein_grams=excluded.protein_grams, fat_grams=excluded.fat_grams, carb_grams=excluded.carb_grams, updated_at=CURRENT_TIMESTAMP
    RETURNING *
  `).bind(date, calories, protein, fats, carbs).first<DailyCheckin>()
}

export async function recordApiWrite(action: string, entityType: string, entityId?: number | string, payload?: unknown) {
  await db().prepare('INSERT INTO agent_audit_log (action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?)')
    .bind(action, entityType, entityId === undefined ? null : String(entityId), payload === undefined ? null : JSON.stringify(payload))
    .run()
}
