import { env } from 'cloudflare:workers'
import { calculateDailyStreak, startOfWeekIso } from './metrics'
import type { DailyCheckin, DashboardSummary } from './types'

export const db = () => env.DB

export async function dashboardSummary(): Promise<DashboardSummary> {
  const database = db()
  const weekStart = startOfWeekIso()
  const [checkin, weightTrend, streakRows, weeklyCheckins] = await Promise.all([
    database.prepare('SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 1').first<DailyCheckin>(),
    database.prepare('SELECT date, weight_kg FROM daily_checkins WHERE weight_kg IS NOT NULL ORDER BY date DESC LIMIT 14').all<{ date: string; weight_kg: number }>(),
    database.prepare("SELECT date FROM daily_checkins WHERE date >= date('now', '-120 days') ORDER BY date DESC").all<{ date: string }>(),
    database.prepare('SELECT date FROM daily_checkins WHERE date >= ? ORDER BY date').bind(weekStart).all<{ date: string }>(),
  ])
  return {
    checkin,
    weightTrend: weightTrend.results,
    streak: calculateDailyStreak(streakRows.results),
    weeklyCheckins: weeklyCheckins.results,
  }
}

export async function recordApiWrite(action: string, entityType: string, entityId?: number | string, payload?: unknown) {
  await db().prepare('INSERT INTO agent_audit_log (action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?)')
    .bind(action, entityType, entityId === undefined ? null : String(entityId), payload === undefined ? null : JSON.stringify(payload))
    .run()
}
