import { describe, expect, it } from 'vitest'
import { checkinSchema, weeklyReviewSchema } from './schemas'

describe('daily check-in schema', () => {
  it('accepts the streamlined daily fields', () => {
    expect(checkinSchema.parse({
      date: '2026-07-30',
      weight_kg: 80,
      sleep_time: '23:30',
      wake_time: '07:00',
      water_liters: 2.5,
      protein_grams: 150,
      notes: 'Good day',
    })).toMatchObject({ date: '2026-07-30', sleep_time: '23:30', wake_time: '07:00' })
  })

  it.each(['sleep_hours', 'sleep_quality', 'energy', 'motivation', 'recovery', 'soreness', 'stress', 'mood'])('rejects removed field %s', (field) => {
    expect(() => checkinSchema.parse({ date: '2026-07-30', [field]: 5 })).toThrow()
  })

  it('requires sleep and wake times together', () => {
    expect(() => checkinSchema.parse({ date: '2026-07-30', sleep_time: '23:30' })).toThrow()
  })
})

describe('weekly review schema', () => {
  it('rejects retired workout fields', () => {
    expect(() => weeklyReviewSchema.parse({ week_start: '2026-07-27', workouts_completed: 3 })).toThrow()
    expect(() => weeklyReviewSchema.parse({ week_start: '2026-07-27', missed_workouts: 1 })).toThrow()
    expect(() => weeklyReviewSchema.parse({ week_start: '2026-07-27', best_workout: 'Legacy session' })).toThrow()
  })
})
