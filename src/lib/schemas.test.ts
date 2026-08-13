import { describe, expect, it } from 'vitest'
import { checkinSchema } from './schemas'

describe('daily check-in schema', () => {
  it('accepts the streamlined daily fields', () => {
    expect(checkinSchema.parse({
      date: '2026-07-30',
      weight_kg: 80,
      sleep_hours: 7.5,
      water_liters: 2.5,
      protein_grams: 150,
      calories: 2400,
      nutrition_notes: 'Breakfast: eggs\nLunch: daal\nDinner: chicken',
      workout_text: 'Lower re-entry session logged in Lyfta',
      notes: 'Good day',
    })).toMatchObject({ date: '2026-07-30', sleep_hours: 7.5 })
  })

  it.each(['sleep_time', 'wake_time', 'sleep_quality', 'energy', 'motivation', 'recovery', 'soreness', 'stress', 'mood'])('rejects removed field %s', (field) => {
    expect(() => checkinSchema.parse({ date: '2026-07-30', [field]: 5 })).toThrow()
  })

  it('rejects impossible sleep hours', () => {
    expect(() => checkinSchema.parse({ date: '2026-07-30', sleep_hours: 25 })).toThrow()
  })
})
