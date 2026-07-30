import { describe, expect, it } from 'vitest'
import { calculateDailyStreak, calculateSleepHours, startOfWeekIso } from './metrics'

describe('wellness metrics', () => {
  it('calculates a streak through today', () => {
    expect(calculateDailyStreak(
      [{ date: '2026-08-10' }, { date: '2026-08-09' }, { date: '2026-08-08' }],
      new Date('2026-08-10T18:00:00Z'),
    )).toBe(3)
  })

  it('allows an unfinished today without breaking yesterday’s streak', () => {
    expect(calculateDailyStreak(
      [{ date: '2026-08-09' }, { date: '2026-08-08' }],
      new Date('2026-08-10T08:00:00Z'),
    )).toBe(2)
  })

  it('stops a streak at the first missing day', () => {
    expect(calculateDailyStreak(
      [{ date: '2026-08-10' }, { date: '2026-08-08' }],
      new Date('2026-08-10T08:00:00Z'),
    )).toBe(1)
  })

  it('uses Monday as the UTC week boundary', () => {
    expect(startOfWeekIso(new Date('2026-08-16T23:00:00Z'))).toBe('2026-08-10')
  })

  it('calculates sleep duration across midnight', () => {
    expect(calculateSleepHours('23:30', '07:00')).toBe(7.5)
    expect(calculateSleepHours('22:45', '06:15')).toBe(7.5)
  })

  it('calculates same-day sleep duration', () => {
    expect(calculateSleepHours('01:00', '08:30')).toBe(7.5)
  })

})
