import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { dashboardSummary, db } from './db'
import { listRecipes } from './recipes'
import { buildDailyReports } from './reports'
import type { DailyCheckin, Profile, ProgressPhoto } from './types'

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
  const checkins = await db().prepare('SELECT date, weight_kg, sleep_hours, water_liters, protein_grams, fat_grams, carb_grams, calories FROM daily_checkins ORDER BY date').all<DailyCheckin>()
  return buildDailyReports(checkins.results)
})

export const getRecipesData = createServerFn({ method: 'GET' }).handler(async () => {
  disableCaching()
  return listRecipes()
})
