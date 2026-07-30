import { describe, expect, it } from 'vitest'
import { calculateDailyStreak, estimatedOneRepMax, progressionSuggestion, startOfWeekIso } from './metrics'

describe('fitness metrics', () => {
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

  it('calculates and rounds estimated one-rep max', () => {
    expect(estimatedOneRepMax(100, 5)).toBe(116.7)
    expect(estimatedOneRepMax(0, 5)).toBeNull()
  })

  it('suggests conservative double progression', () => {
    expect(progressionSuggestion({ reps: 6, rpe: 9 })).toContain('Maintain')
    expect(progressionSuggestion({ reps: 10, rpe: 8 })).toContain('load increase')
    expect(progressionSuggestion({ reps: 8, rpe: 8 })).toContain('one clean rep')
  })
})
