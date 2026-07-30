import { describe, expect, it } from 'vitest'
import { aggregateReports, buildDailyReports, reportAverages } from './reports'

const daily = buildDailyReports([
  { date: '2026-07-27', weight_kg: 70, sleep_hours: 7, water_liters: 2, protein_grams: 120 },
  { date: '2026-07-28', weight_kg: 71, sleep_hours: 8, water_liters: null, protein_grams: null },
  { date: '2026-08-02', weight_kg: 72, sleep_hours: 6, water_liters: 3, protein_grams: 140 },
])

describe('reports', () => {
  it('builds one daily point per check-in', () => {
    expect(daily).toHaveLength(3)
    expect(daily[1]).toMatchObject({ period: '2026-07-28', weight_kg: 71, water_liters: null, protein_grams: null, checkins: 1 })
  })

  it('aggregates calendar weeks using Monday boundaries', () => {
    expect(aggregateReports(daily, 'weekly')).toEqual([
      expect.objectContaining({ period: '2026-07-27', weight_kg: 71, checkins: 3 }),
    ])
  })

  it('aggregates calendar months', () => {
    const months = aggregateReports(daily, 'monthly')
    expect(months).toHaveLength(2)
    expect(months[0]).toMatchObject({ period: '2026-07-01', weight_kg: 70.5, checkins: 2 })
    expect(months[1]).toMatchObject({ period: '2026-08-01', weight_kg: 72, checkins: 1 })
  })

  it('calculates summary averages without treating missing values as zero', () => {
    expect(reportAverages(daily)).toMatchObject({ weight_kg: 71, sleep_hours: 7, checkins: 3 })
  })
})
