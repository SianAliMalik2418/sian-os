import { startOfWeekIso } from './metrics'

export interface DailyReportPoint {
  period: string
  weight_kg: number | null
  sleep_hours: number | null
  water_liters: number | null
  protein_grams: number | null
  calories: number | null
  checkins: number
}

interface CheckinReportSource {
  date: string
  weight_kg: number | null
  sleep_hours: number | null
  water_liters: number | null
  protein_grams: number | null
  calories: number | null
}

function average(values: Array<number | null | undefined>) {
  const present = values.filter((value): value is number => value !== null && value !== undefined)
  if (!present.length) return null
  return Math.round((present.reduce((total, value) => total + value, 0) / present.length) * 100) / 100
}

export function buildDailyReports(checkins: CheckinReportSource[]) {
  return checkins
    .map((checkin): DailyReportPoint => ({
      period: checkin.date,
      weight_kg: checkin.weight_kg,
      sleep_hours: checkin.sleep_hours,
      water_liters: checkin.water_liters,
      protein_grams: checkin.protein_grams,
      calories: checkin.calories,
      checkins: 1,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

export function aggregateReports(points: DailyReportPoint[], interval: 'weekly' | 'monthly') {
  const groups = new Map<string, DailyReportPoint[]>()
  for (const point of points) {
    const period = interval === 'weekly'
      ? startOfWeekIso(new Date(`${point.period}T00:00:00.000Z`))
      : `${point.period.slice(0, 7)}-01`
    groups.set(period, [...(groups.get(period) ?? []), point])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, rows]): DailyReportPoint => ({
      period,
      weight_kg: average(rows.map((row) => row.weight_kg)),
      sleep_hours: average(rows.map((row) => row.sleep_hours)),
      water_liters: average(rows.map((row) => row.water_liters)),
      protein_grams: average(rows.map((row) => row.protein_grams)),
      calories: average(rows.map((row) => row.calories)),
      checkins: rows.reduce((total, row) => total + row.checkins, 0),
    }))
}

export function reportAverages(points: DailyReportPoint[]) {
  return {
    weight_kg: average(points.map((point) => point.weight_kg)),
    sleep_hours: average(points.map((point) => point.sleep_hours)),
    water_liters: average(points.map((point) => point.water_liters)),
    protein_grams: average(points.map((point) => point.protein_grams)),
    calories: average(points.map((point) => point.calories)),
    checkins: points.reduce((total, point) => total + point.checkins, 0),
  }
}
