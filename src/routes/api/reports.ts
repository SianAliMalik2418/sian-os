import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'
import { aggregateReports, buildDailyReports, reportAverages } from '@/lib/reports'
import type { DailyCheckin } from '@/lib/types'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const Route = createFileRoute('/api/reports')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const url = new URL(request.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const interval = url.searchParams.get('interval') ?? 'daily'
        if (from && !datePattern.test(from)) throw new HttpError(400, 'INVALID_FROM_DATE', 'from must use YYYY-MM-DD')
        if (to && !datePattern.test(to)) throw new HttpError(400, 'INVALID_TO_DATE', 'to must use YYYY-MM-DD')
        if (from && to && from > to) throw new HttpError(400, 'INVALID_DATE_RANGE', 'from must be on or before to')
        if (interval !== 'daily' && interval !== 'weekly' && interval !== 'monthly') throw new HttpError(400, 'INVALID_INTERVAL', 'interval must be daily, weekly, or monthly')

        const lowerBound = from ?? '0000-01-01'
        const upperBound = to ?? '9999-12-31'
        const checkins = await db().prepare('SELECT date, weight_kg, waist_inches, sleep_hours, water_liters, protein_grams, fat_grams, carb_grams, calories FROM daily_checkins WHERE date BETWEEN ? AND ? ORDER BY date').bind(lowerBound, upperBound).all<DailyCheckin>()
        const daily = buildDailyReports(checkins.results)
        const points = interval === 'daily' ? daily : aggregateReports(daily, interval)
        return json({ ok: true, data: { from, to, interval, summary: reportAverages(daily), points } })
      }),
    },
  },
})
