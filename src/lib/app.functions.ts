import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { dashboardSummary, db } from './db'
import { fetchLyftaWorkouts } from './lyfta'
import { listRecipeBundles } from './recipe-bundles'
import { listRecipes } from './recipes'
import { buildDailyReports } from './reports'
import type { DailyCheckin, GoalPhase, Profile, ProgressPhoto } from './types'

function disableCaching() {
  setResponseHeader('Cache-Control', 'no-store')
}

export const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  return dashboardSummary()
})

export const getTodayCheckin = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const today = new Date().toISOString().slice(0, 10)
  return db().prepare('SELECT * FROM daily_checkins WHERE date = ?').bind(today).first<DailyCheckin>()
})

export const getProfileData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  return db().prepare('SELECT * FROM profile WHERE id = 1').first<Profile>()
})

export const getProgressPhotos = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const result = await db().prepare('SELECT id, date, label, notes, created_at FROM progress_photos ORDER BY date DESC, id DESC LIMIT 500').all<ProgressPhoto>()
  return result.results
})

export const getReportsData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const checkins = await db().prepare('SELECT date, weight_kg, waist_inches, water_liters, steps, active_calories, protein_grams, fat_grams, carb_grams, calories FROM daily_checkins ORDER BY date').all<DailyCheckin>()
  return buildDailyReports(checkins.results)
})

export const getRecipesData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const [recipes, bundles] = await Promise.all([listRecipes(), listRecipeBundles()])
  return { recipes, bundles }
})

export const getLyftaWorkoutsData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  return fetchLyftaWorkouts({ apiKey: env.LYFTA_API_KEY, limit: 20, page: 1 })
})

export const getLatestLyftaWorkout = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  try {
    const result = await fetchLyftaWorkouts({ apiKey: env.LYFTA_API_KEY, limit: 1, page: 1 })
    return result.available ? (result.workouts[0] ?? null) : null
  } catch {
    return null
  }
})

export const getGoalPhasesData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const result = await db().prepare('SELECT * FROM goal_phases ORDER BY started_at DESC, id DESC LIMIT 100').all<GoalPhase>()
  return result.results
})

export const getCoachNote = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  const row = await db().prepare("SELECT value FROM agent_state WHERE key = 'last_nightly_review_note'").first<{ value: string | null }>()
  return row?.value?.trim() || null
})
